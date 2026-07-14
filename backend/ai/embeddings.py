import os
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image

class ImageEmbeddingPipeline:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(ImageEmbeddingPipeline, cls).__new__(cls, *args, **kwargs)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        # Force CPU device for local student server setups
        self.device = torch.device('cpu')
        
        # Load pre-trained MobileNetV2
        try:
            # Modern torchvision style
            self.model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
        except AttributeError:
            # Legacy torchvision style
            self.model = models.mobilenet_v2(pretrained=True)
            
        # Replace classification head with Identity to obtain the raw pooling features (1280-d)
        self.model.classifier = torch.nn.Identity()
        self.model.to(self.device)
        self.model.eval()
        
        # Standardization transforms using ImageNet statistics
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        self._initialized = True

    def get_embedding(self, image_path):
        """
        Generates a 1280-dimensional feature vector for the image at image_path.
        Returns a list of 1280 floats if successful, None if anything fails.
        """
        if not os.path.exists(image_path):
            print(f"Embedding generation warning: File {image_path} does not exist.")
            return None

        try:
            image = Image.open(image_path).convert('RGB')
            tensor = self.transform(image).unsqueeze(0).to(self.device)
            with torch.no_grad():
                features = self.model(tensor)
            # Flatten features and cast to python list
            embedding = features.squeeze(0).cpu().tolist()
            return embedding
        except Exception as e:
            print(f"Embedding generation error for {image_path}: {e}")
            return None

# Global pipeline instance initialized on import
pipeline = ImageEmbeddingPipeline()
