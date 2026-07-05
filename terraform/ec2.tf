data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

resource "aws_instance" "web" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.web_sg.id]

  # Require IMDSv2: blocks SSRF-style credential theft via the metadata service
  metadata_options {
    http_tokens   = "required"
    http_endpoint = "enabled"
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
  }

  user_data = <<-EOF
    #!/bin/bash
    set -euo pipefail
    exec > /var/log/user-data.log 2>&1

    apt-get update -y
    # docker-compose-v2 provides the "docker compose" plugin on Ubuntu 24.04
    apt-get install -y docker.io docker-compose-v2 git unattended-upgrades

    systemctl enable --now docker
    usermod -aG docker ubuntu

    # Automatic security patches
    systemctl enable --now unattended-upgrades

    git clone ${var.repository_url} /opt/warrior-code-portal

    cd /opt/warrior-code-portal/app
    echo "WEB_PORT=80" > .env
    docker compose up -d --build
  EOF

  lifecycle {
    # most_recent AMI lookups change over time; do not replace a running
    # instance just because Canonical published a newer image.
    ignore_changes = [ami]
  }

  tags = {
    Name    = "warrior-code-web"
    Project = "WarriorCodePortal"
  }
}
