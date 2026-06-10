data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

resource "aws_instance" "example" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.micro"
  key_name               = "WilchesFitness"
  vpc_security_group_ids = [aws_security_group.web_sg.id]

  user_data = <<-EOF
    #!/bin/bash
    exec > /var/log/user-data.log 2>&1

    apt-get update -y
    apt-get install -y docker.io docker-compose git

    systemctl start docker
    systemctl enable docker
    usermod -aG docker ubuntu

    git clone https://github.com/mroscarwilches-debug/MiZonaFitPortal.git /opt/wilchesfitness

    cd /opt/wilchesfitness/app
    docker-compose up -d --build
  EOF

  tags = {
    Name = "MiZonaFitPortal"
  }
}