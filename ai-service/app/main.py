# ============================================
# GuardianSync v2.0 - AI Service
# Python FastAPI Face Recognition Service
# ============================================
# 
# This service handles all CPU-intensive face recognition operations
# to keep the Node.js API Gateway non-blocking.
#
# Endpoints:
#   POST /api/v1/face/encode    - Generate face encoding from image
#   POST /api/v1/face/compare   - Compare two face encodings
#   POST /api/v1/face/identify  - Find matching face from database encodings
#   GET  /health                - Health check
#
# ============================================

from fastapi import FastAPI, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Optional
import numpy as np
import face_recognition
import io
import base64
import logging
from contextlib import asynccontextmanager

# ============================================
# Configuration & Logging
# ============================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ai-service")

# ============================================
# Pydantic Schemas for Request/Response
# ============================================

class FaceEncodingResponse(BaseModel):
    """Response model for face encoding generation"""
    success: bool
    face_encoding: Optional[List[float]] = Field(
        None, 
        description="128-dimensional face encoding vector"
    )
    faces_detected: int = Field(
        description="Number of faces detected in image"
    )
    message: str

class FaceCompareRequest(BaseModel):
    """Request model for comparing two face encodings"""
    encoding_1: List[float] = Field(
        ..., 
        min_items=128, 
        max_items=128,
        description="First face encoding (128 floats)"
    )
    encoding_2: List[float] = Field(
        ..., 
        min_items=128, 
        max_items=128,
        description="Second face encoding (128 floats)"
    )
    tolerance: float = Field(
        default=0.6,
        ge=0.0,
        le=1.0,
        description="Match tolerance (lower = stricter)"
    )

class FaceCompareResponse(BaseModel):
    """Response model for face comparison"""
    is_match: bool
    distance: float = Field(description="Euclidean distance between encodings")
    confidence: float = Field(description="Match confidence percentage")

class FaceIdentifyRequest(BaseModel):
    """Request model for identifying a face against multiple encodings"""
    probe_encoding: List[float] = Field(
        ..., 
        min_items=128, 
        max_items=128,
        description="Face encoding to search for"
    )
    known_encodings: List[dict] = Field(
        ...,
        description="List of {id: string, encoding: float[128]} objects"
    )
    tolerance: float = Field(default=0.6, ge=0.0, le=1.0)

class FaceIdentifyResponse(BaseModel):
    """Response model for face identification"""
    found: bool
    matched_id: Optional[str] = None
    distance: Optional[float] = None
    confidence: Optional[float] = None
    all_distances: Optional[List[dict]] = None

class Base64ImageRequest(BaseModel):
    """Request model for base64 encoded image"""
    image_base64: str = Field(
        ...,
        description="Base64 encoded image (without data URI prefix)"
    )

# ============================================
# Application Lifecycle
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager.
    Runs startup/shutdown logic.
    """
    # Startup
    logger.info("🚀 AI Service starting up...")
    logger.info("✅ Face recognition models loaded")
    yield
    # Shutdown
    logger.info("🛑 AI Service shutting down...")

# ============================================
# FastAPI Application
# ============================================

app = FastAPI(
    title="GuardianSync AI Service",
    description="Face recognition microservice for child safety tracking",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration - Adjust origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Helper Functions
# ============================================

def decode_base64_image(base64_string: str) -> np.ndarray:
    """
    Decode a base64 string to a numpy array image.
    
    Args:
        base64_string: Base64 encoded image (with or without data URI prefix)
    
    Returns:
        numpy.ndarray: RGB image array
    
    Raises:
        HTTPException: If image cannot be decoded
    """
    try:
        # Remove data URI prefix if present
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_string)
        
        # Load image using face_recognition (which uses PIL internally)
        image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        
        return image
    except Exception as e:
        logger.error(f"Failed to decode base64 image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image data: {str(e)}"
        )

def calculate_confidence(distance: float, tolerance: float = 0.6) -> float:
    """
    Convert face distance to confidence percentage.
    
    Args:
        distance: Euclidean distance between face encodings
        tolerance: Maximum distance considered a match
    
    Returns:
        float: Confidence percentage (0-100)
    """
    if distance > tolerance:
        return max(0, (1 - distance) * 100)
    return min(100, (1 - (distance / tolerance)) * 100)

# ============================================
# API Endpoints
# ============================================

@app.get("/health")
async def health_check():
    """
    Health check endpoint for container orchestration.
    Returns service status and version info.
    """
    return {
        "status": "healthy",
        "service": "ai-service",
        "version": "2.0.0",
        "capabilities": ["face_encoding", "face_comparison", "face_identification"]
    }

@app.post("/api/v1/face/encode", response_model=FaceEncodingResponse)
async def encode_face_from_file(file: UploadFile = File(...)):
    """
    Generate a 128-dimensional face encoding from an uploaded image file.
    
    This endpoint:
    1. Receives an image file (JPEG, PNG, etc.)
    2. Detects faces in the image
    3. Returns the face encoding for the first detected face
    
    The encoding can be stored in MongoDB for later comparison.
    
    Args:
        file: Uploaded image file
    
    Returns:
        FaceEncodingResponse with face encoding or error message
    """
    logger.info(f"Processing face encoding request: {file.filename}")
    
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Load image for face_recognition
        image = face_recognition.load_image_file(io.BytesIO(contents))
        
        # Detect face locations (using CNN model for accuracy, or 'hog' for speed)
        # Using 'hog' for faster processing - switch to 'cnn' for production with GPU
        face_locations = face_recognition.face_locations(image, model="hog")
        
        if not face_locations:
            logger.warning("No faces detected in uploaded image")
            return FaceEncodingResponse(
                success=False,
                face_encoding=None,
                faces_detected=0,
                message="No faces detected in the image. Please upload a clear face photo."
            )
        
        if len(face_locations) > 1:
            logger.warning(f"Multiple faces detected: {len(face_locations)}")
            # Still process, but warn - take the first/largest face
        
        # Generate face encoding for the first detected face
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        if not face_encodings:
            return FaceEncodingResponse(
                success=False,
                face_encoding=None,
                faces_detected=len(face_locations),
                message="Could not generate encoding for detected face."
            )
        
        # Convert numpy array to list for JSON serialization
        encoding_list = face_encodings[0].tolist()
        
        logger.info(f"Successfully generated face encoding ({len(encoding_list)} dimensions)")
        
        return FaceEncodingResponse(
            success=True,
            face_encoding=encoding_list,
            faces_detected=len(face_locations),
            message=f"Successfully encoded face. {len(face_locations)} face(s) detected."
        )
        
    except Exception as e:
        logger.error(f"Error processing face encoding: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face encoding failed: {str(e)}"
        )

@app.post("/api/v1/face/encode-base64", response_model=FaceEncodingResponse)
async def encode_face_from_base64(request: Base64ImageRequest):
    """
    Generate face encoding from a base64-encoded image.
    
    Useful when receiving images directly from mobile apps
    that capture photos as base64 strings.
    
    Args:
        request: Base64ImageRequest containing the image data
    
    Returns:
        FaceEncodingResponse with face encoding or error message
    """
    logger.info("Processing base64 face encoding request")
    
    try:
        # Decode base64 to image array
        image = decode_base64_image(request.image_base64)
        
        # Detect faces
        face_locations = face_recognition.face_locations(image, model="hog")
        
        if not face_locations:
            return FaceEncodingResponse(
                success=False,
                face_encoding=None,
                faces_detected=0,
                message="No faces detected in the image."
            )
        
        # Generate encoding
        face_encodings = face_recognition.face_encodings(image, face_locations)
        
        if not face_encodings:
            return FaceEncodingResponse(
                success=False,
                face_encoding=None,
                faces_detected=len(face_locations),
                message="Could not generate encoding for detected face."
            )
        
        return FaceEncodingResponse(
            success=True,
            face_encoding=face_encodings[0].tolist(),
            faces_detected=len(face_locations),
            message="Successfully encoded face from base64 image."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Base64 encoding error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face encoding failed: {str(e)}"
        )

@app.post("/api/v1/face/compare", response_model=FaceCompareResponse)
async def compare_faces(request: FaceCompareRequest):
    """
    Compare two face encodings to determine if they match.
    
    Uses Euclidean distance to measure similarity.
    A distance below the tolerance indicates a match.
    
    Args:
        request: FaceCompareRequest with two encodings and optional tolerance
    
    Returns:
        FaceCompareResponse with match result and confidence
    """
    logger.info("Processing face comparison request")
    
    try:
        # Convert lists to numpy arrays
        encoding_1 = np.array(request.encoding_1)
        encoding_2 = np.array(request.encoding_2)
        
        # Calculate Euclidean distance
        distance = float(np.linalg.norm(encoding_1 - encoding_2))
        
        # Determine if it's a match based on tolerance
        is_match = distance <= request.tolerance
        
        # Calculate confidence
        confidence = calculate_confidence(distance, request.tolerance)
        
        logger.info(f"Comparison result: match={is_match}, distance={distance:.4f}")
        
        return FaceCompareResponse(
            is_match=is_match,
            distance=round(distance, 6),
            confidence=round(confidence, 2)
        )
        
    except Exception as e:
        logger.error(f"Face comparison error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face comparison failed: {str(e)}"
        )

@app.post("/api/v1/face/identify", response_model=FaceIdentifyResponse)
async def identify_face(request: FaceIdentifyRequest):
    """
    Identify a face by comparing against a list of known encodings.
    
    This is the core endpoint for the face scan feature.
    It receives a probe encoding and searches through known encodings
    to find the best match.
    
    Args:
        request: FaceIdentifyRequest with probe encoding and known encodings list
    
    Returns:
        FaceIdentifyResponse with matched ID and confidence if found
    """
    logger.info(f"Identifying face against {len(request.known_encodings)} known encodings")
    
    try:
        # Convert probe to numpy array
        probe = np.array(request.probe_encoding)
        
        # Calculate distances to all known encodings
        distances = []
        for known in request.known_encodings:
            try:
                known_encoding = np.array(known["encoding"])
                distance = float(np.linalg.norm(probe - known_encoding))
                distances.append({
                    "id": known["id"],
                    "distance": round(distance, 6),
                    "confidence": round(calculate_confidence(distance, request.tolerance), 2)
                })
            except (KeyError, ValueError) as e:
                logger.warning(f"Invalid encoding entry: {e}")
                continue
        
        if not distances:
            return FaceIdentifyResponse(
                found=False,
                message="No valid encodings to compare against"
            )
        
        # Sort by distance (ascending - closest first)
        distances.sort(key=lambda x: x["distance"])
        
        # Check if best match is within tolerance
        best_match = distances[0]
        
        if best_match["distance"] <= request.tolerance:
            logger.info(f"Face identified: {best_match['id']} with confidence {best_match['confidence']}%")
            return FaceIdentifyResponse(
                found=True,
                matched_id=best_match["id"],
                distance=best_match["distance"],
                confidence=best_match["confidence"],
                all_distances=distances[:5]  # Return top 5 for debugging
            )
        else:
            logger.info("No matching face found within tolerance")
            return FaceIdentifyResponse(
                found=False,
                matched_id=None,
                distance=best_match["distance"],
                confidence=best_match["confidence"],
                all_distances=distances[:5]
            )
            
    except Exception as e:
        logger.error(f"Face identification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face identification failed: {str(e)}"
        )

# ============================================
# Main Entry Point
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
