# main.tf o provider.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # Recomendado para asegurar compatibilidad [8]
    }
  }
}

provider "aws" {
  region = "us-east-1"
  # Se recomienda usar variables de entorno para credenciales
  # access_key = "TU_ACCESS_KEY"
  # secret_key = "TU_SECRET_KEY"
}
