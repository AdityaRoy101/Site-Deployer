# Site Deployer 🚀

A production-ready, enterprise-grade site deployment service that automatically builds and deploys React, Vue, Angular, and other static sites to AWS S3 with CloudFront CDN integration.

## Features

✅ **Multi-Framework Support**: React, Vue, Angular, and other static site generators  
✅ **AWS Integration**: Seamless S3 and CloudFront deployment  
✅ **Redis Caching**: Intelligent caching for faster repeated deployments  
✅ **Production Ready**: Comprehensive logging, error handling, and monitoring  
✅ **Security First**: Rate limiting, CORS, Helmet security headers  
✅ **Docker Support**: Full containerization with Docker Compose  
✅ **Process Management**: PM2 configuration for clustering and auto-restart  
✅ **Code Quality**: ESLint, Prettier, and comprehensive testing setup  
✅ **Health Checks**: Built-in health monitoring and status endpoints  

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Redis (optional, for caching)
- AWS Account with S3 and CloudFront configured

### Installation

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd site_deployer
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Production Deployment**
   ```bash
   npm start
   # or with PM2
   npm run pm2:start
   ```

## Environment Configuration

### Required Variables

```env
# AWS Configuration (Required)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
CLOUDFRONT_URL=https://your-cloudfront-url.cloudfront.net
```

### Optional Variables

See `.env.example` for all available configuration options.

## API Documentation

### Deploy Endpoint

**POST** `/api/v1/deploy`

```json
{
  "githubUrl": "https://github.com/username/repo",
  "projectName": "myproject",
  "buildCommand": "npm run build",
  "outputDir": "build",
  "nodeVersion": "18.0.0"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://your-cloudfront-url.cloudfront.net/myproject/index.html",
  "deploymentId": "uuid-here",
  "deploymentTime": 45000,
  "message": "Project deployed successfully"
}
```

### Health Check

**GET** `/api/v1/health/health`

```json
{
  "success": true,
  "message": "Service is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Performance Optimizations

- **Caching**: Redis-based deployment caching
- **Compression**: Gzip compression for text assets
- **CDN**: CloudFront for global content delivery
- **Clustering**: PM2 cluster mode for multi-core utilization
- **Connection Pooling**: Optimized AWS SDK configuration
- **Rate Limiting**: Intelligent request throttling

## Security Features

- **Helmet**: Security headers middleware
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: DDoS protection
- **Input Validation**: Joi schema validation
- **Error Handling**: Secure error responses
- **Process Isolation**: Non-root Docker containers

## Monitoring & Logging

### Logs

- **Application Logs**: `logs/application-YYYY-MM-DD.log`
- **Access Logs**: Morgan HTTP request logging

### Health Monitoring

- **Health Endpoint**: `/api/v1/health/health`

## Development

### Code Quality

```bash
# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Testing
npm test
npm run test:coverage
```

### Project Structure

```
src/
├── config/          # Configuration management
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic
└── app.js          # Express app setup

utils/
└── logger.js       # Winston logger configuration

scripts/
└── health-check.js # Health check script

tests/              # Test files
logs/              # Application logs
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify package.json scripts
   - Review build logs in application logs

2. **AWS Upload Issues**
   - Verify AWS credentials and permissions
   - Check S3 bucket policy
   - Ensure CloudFront distribution is active

3. **Redis Connection Issues**
   - Verify Redis URL configuration
   - Check Redis server status
   - Review Redis connection logs

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm start

# Or set in .env
LOG_LEVEL=debug
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

ISC License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the logs for error details

---

**Built with ❤️ for reliable, scalable deployments**
