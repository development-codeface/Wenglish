# Wenglish

Wenglish is a powerful language learning or communication platform integrating AI-driven voice synthesis, cloud storage, and automated mailing services.

## 🚀 Getting Started

### Prerequisites
- Node.js installed on your machine.
- A MongoDB instance (local or Atlas).
- Active API keys for the services listed below.

### Installation
1. Clone the repository to your local machine.
2. Navigate to the project folder and install dependencies:

```bash
npm i

# Server Configuration
PORT=3000
JWT_SECRET=your_jwt_secret_key

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/wenglish

# AI & Voice Services
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_api_key

# AWS S3 Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_bucket_name

# Email Service (SMTP)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_passwor