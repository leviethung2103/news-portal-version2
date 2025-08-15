import boto3
import uuid
from io import BytesIO
from typing import Optional
from PIL import Image
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_DEFAULT_REGION
        )
        self.bucket_name = settings.S3_BUCKET_NAME

    def upload_image(self, image_data: bytes, content_type: str = "image/jpeg") -> Optional[str]:
        """
        Upload image to S3 with compression and return the public URL.
        
        Args:
            image_data: Raw image bytes
            content_type: MIME type of the image
            
        Returns:
            Public URL of uploaded image or None if upload fails
        """
        try:
            # Generate unique filename
            file_extension = self._get_file_extension(content_type)
            filename = f"vision-board/{uuid.uuid4()}{file_extension}"
            
            # Compress image before upload
            compressed_data = self._compress_image(image_data)
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=filename,
                Body=compressed_data,
                ContentType=content_type,
                # ACL='public-read'  # Make image publicly accessible
            )
            
            # Return public URL
            public_url = f"https://{self.bucket_name}.s3.{settings.AWS_DEFAULT_REGION}.amazonaws.com/{filename}"
            logger.info(f"Successfully uploaded image to S3: {public_url}")
            return public_url
            
        except Exception as e:
            logger.error(f"Failed to upload image to S3: {str(e)}")
            return None

    def _compress_image(self, image_data: bytes, max_size: int = 800, quality: int = 85) -> bytes:
        """
        Compress image to reduce file size while maintaining quality.
        
        Args:
            image_data: Raw image bytes
            max_size: Maximum dimension (width or height) in pixels
            quality: JPEG quality (1-100)
            
        Returns:
            Compressed image bytes
        """
        try:
            # Open image
            img = Image.open(BytesIO(image_data))
            
            # Convert to RGB if needed (for JPEG compatibility)
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Calculate new dimensions
            width, height = img.size
            if width > height:
                if width > max_size:
                    height = int((height * max_size) / width)
                    width = max_size
            else:
                if height > max_size:
                    width = int((width * max_size) / height)
                    height = max_size
            
            # Resize image
            if width != img.size[0] or height != img.size[1]:
                img = img.resize((width, height), Image.Resampling.LANCZOS)
            
            # Save compressed image to bytes
            output = BytesIO()
            img.save(output, format='JPEG', quality=quality, optimize=True)
            return output.getvalue()
            
        except Exception as e:
            logger.warning(f"Image compression failed, using original: {str(e)}")
            return image_data

    def _get_file_extension(self, content_type: str) -> str:
        """Get file extension from content type."""
        extension_map = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg', 
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp'
        }
        return extension_map.get(content_type.lower(), '.jpg')

    def delete_image(self, image_url: str) -> bool:
        """
        Delete image from S3 using its URL.
        
        Args:
            image_url: Full S3 URL of the image
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            # Extract key from URL
            # URL format: https://bucket.s3.region.amazonaws.com/key
            if f"{self.bucket_name}.s3." in image_url:
                key = image_url.split(f"/{self.bucket_name}.s3.{settings.AWS_DEFAULT_REGION}.amazonaws.com/")[1]
                
                self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=key
                )
                logger.info(f"Successfully deleted image from S3: {key}")
                return True
        except Exception as e:
            logger.error(f"Failed to delete image from S3: {str(e)}")
            
        return False

# Global instance
s3_service = S3Service()