variable "admin_cidr" {
  description = "CIDR allowed to reach the instance over SSH (your public IP /32)"
  type        = string
  default     = "181.63.25.164/32"

  validation {
    condition     = can(cidrhost(var.admin_cidr, 0)) && !startswith(var.admin_cidr, "0.0.0.0")
    error_message = "admin_cidr must be a specific CIDR, never 0.0.0.0/0 (SSH must not be public)."
  }
}

variable "http_ingress_cidr" {
  description = "CIDR allowed to reach the site over HTTP/HTTPS. 0.0.0.0/0 = public Internet (production); set your IP /32 for a private validation phase."
  type        = string
  default     = "0.0.0.0/0"
}

variable "instance_type" {
  description = "EC2 instance type (t3.micro is enough for a static site behind nginx)"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Name of the existing EC2 key pair used for SSH access"
  type        = string
  default     = "WilchesFitness"
}

variable "repository_url" {
  description = "Git repository cloned by the instance at boot"
  type        = string
  default     = "https://github.com/mroscarwilches-debug/warrior-code-portal.git"
}
