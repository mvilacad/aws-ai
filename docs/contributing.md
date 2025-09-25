# Contributing to AWS AI Project

## Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher
- AWS CLI configured
- Git

### Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd aws-ai
```

2. Run the setup script:

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

3. Configure your environment:

```bash
cp .env.example .env
cp .env.local.example .env.local
# Edit these files with your configuration
```

## Development Workflow

### Code Organization

This is a monorepo using pnpm workspaces with the following structure:

- `packages/shared/` - Shared types, utilities, and constants
- `packages/database/` - Database schemas and seeders
- `packages/functions/` - Lambda function implementations
- `packages/infrastructure/` - CDK infrastructure code
- `apps/web/` - Next.js frontend application (not implemented)

### Available Commands

```bash
# Development
pnpm run dev              # Start development servers
pnpm run build            # Build all packages
pnpm run clean            # Clean all build artifacts

# Quality
pnpm run lint             # Run ESLint
pnpm run lint:fix         # Fix linting issues
pnpm run format           # Format code with Prettier
pnpm run format:check     # Check code formatting
pnpm run type-check       # Run TypeScript type checking

# Testing
pnpm run test             # Run all tests
pnpm run test:watch       # Run tests in watch mode

# Deployment
pnpm run deploy:dev       # Deploy to development
pnpm run deploy:prod      # Deploy to production

# Data management
pnpm run seed-data        # Seed database with sample data
```

### Making Changes

1. Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes following the coding standards

3. Run quality checks:

```bash
pnpm run lint
pnpm run type-check
pnpm run test
```

4. Commit using conventional commits:

```bash
git commit -m "feat: add violation analysis endpoint"
```

5. Push and create a Pull Request

### Coding Standards

#### TypeScript

- Use strict TypeScript configuration
- Prefer explicit types over `any`
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

#### Code Style

- Use Prettier for formatting (runs automatically)
- Follow ESLint rules (configured in `.eslintrc.js`)
- Use 2 spaces for indentation
- Use single quotes for strings
- No trailing semicolons

#### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `style:` code style changes
- `refactor:` code refactoring
- `test:` test changes
- `chore:` maintenance tasks

### Testing

#### Unit Tests

- Write tests for all business logic
- Use Vitest for testing framework
- Aim for >80% code coverage
- Place tests in `__tests__` directories

Example:

```typescript
import { describe, it, expect } from 'vitest';
import { validateEmail } from '../utils/validation';

describe('validateEmail', () => {
  it('should return true for valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('should return false for invalid email', () => {
    expect(validateEmail('invalid-email')).toBe(false);
  });
});
```

#### Integration Tests

- Test API endpoints end-to-end
- Use real AWS services in test environment
- Clean up resources after tests

### Infrastructure Changes

#### CDK Best Practices

- Use constructs for reusable components
- Separate stacks by logical boundaries
- Use environment-specific configurations
- Add proper IAM permissions (least privilege)
- Tag all resources appropriately

#### Deployment

- Test changes in development environment first
- Use `cdk diff` to review changes
- Production deployments require approval

### Security Guidelines

#### Code Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all inputs
- Use proper authentication and authorization
- Follow OWASP guidelines

#### AWS Security

- Use IAM roles instead of access keys
- Enable CloudTrail logging
- Encrypt data at rest and in transit
- Use VPC when appropriate
- Regular security scans

### Documentation

#### Code Documentation

- Add JSDoc comments for public functions
- Document complex algorithms
- Include usage examples
- Keep README files updated

#### API Documentation

- Document all API endpoints
- Include request/response schemas
- Provide examples
- Document error codes

### Pull Request Process

1. **Pre-submission Checklist:**
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] No breaking changes (or properly documented)

2. **PR Description:**
   - Clear description of changes
   - Link to related issues
   - Screenshots if applicable
   - Testing instructions

3. **Review Process:**
   - At least one approval required
   - All CI checks must pass
   - Address all review comments
   - Squash commits before merge

### Issue Reporting

When reporting bugs or requesting features:

1. Use appropriate issue templates
2. Provide reproduction steps
3. Include environment details
4. Add relevant labels

### Performance Considerations

#### Lambda Functions

- Optimize cold start times
- Use appropriate memory allocation
- Implement proper error handling
- Monitor performance metrics

#### Database

- Design efficient queries
- Use appropriate indexes
- Monitor DynamoDB capacity
- Implement caching where beneficial

#### Frontend

- Optimize bundle sizes
- Implement proper caching
- Use CDN for static assets
- Monitor Core Web Vitals

### Troubleshooting

#### Common Issues

1. **Build Failures:**
   - Check Node.js version
   - Clear node_modules and reinstall
   - Check TypeScript errors

2. **Deployment Issues:**
   - Verify AWS credentials
   - Check CDK bootstrap
   - Review CloudFormation events

3. **Test Failures:**
   - Check environment variables
   - Verify test data
   - Review test isolation

#### Getting Help

- Check existing documentation
- Search closed issues
- Ask in team chat
- Create detailed issue report

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes

### Release Steps

1. Update version in package.json files
2. Update CHANGELOG.md
3. Create release PR
4. Tag release after merge
5. Deploy to production
6. Announce release

## Code of Conduct

Please adhere to our code of conduct:

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the community

---

Thank you for contributing to the AWS AI project! 🚀
