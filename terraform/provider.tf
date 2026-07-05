terraform {
  backend "s3" {
    bucket = "wilchesfitness-tfstate"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
  # Credentials come from the environment (aws configure / env vars).
  # Never hardcode keys in this file.
}
