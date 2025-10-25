# Contributing to ChainMind

Thank you for your interest in contributing to ChainMind! This document provides guidelines and instructions for contributing to the project.

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in your interactions.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- MongoDB database
- Redis server
- Git
- Basic knowledge of TypeScript, React, and Solidity

### Setup Development Environment

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/chainmind.git
   cd chainmind
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   
   # Smart Contracts
   cd ../contracts
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy .env.example files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp contracts/.env.example contracts/.env
   
   # Edit the files and add your API keys
   ```

4. **Start development servers**
   ```bash
   # Backend
   cd backend
   npm run dev:simple
   
   # Frontend (in another terminal)
   cd frontend
   npm run dev
   ```

## 📝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/your-username/chainmind/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, versions)

### Suggesting Features

1. Check existing [Issues](https://github.com/your-username/chainmind/issues) for similar suggestions
2. Create a new issue with:
   - Clear use case description
   - How it benefits users
   - Possible implementation approach
   - Any relevant examples or mockups

### Pull Requests

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**
   - Follow the coding standards (see below)
   - Write or update tests
   - Update documentation if needed

3. **Test your changes**
   ```bash
   # Backend tests
   cd backend
   npm test
   
   # Frontend tests
   cd frontend
   npm test
   
   # Smart contract tests
   cd contracts
   npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve bug in component"
   ```

   Use conventional commits:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting)
   - `refactor:` Code refactoring
   - `test:` Adding or updating tests
   - `chore:` Maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template:
     - Description of changes
     - Related issues
     - Testing done
     - Screenshots (if UI changes)

## 💻 Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint rules (run `npm run lint`)
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep functions small and focused
- Use async/await instead of promises

**Example:**
```typescript
/**
 * Fetches user portfolio data from multiple chains
 * @param address - User wallet address
 * @param chains - Array of chain names to query
 * @returns Promise with aggregated portfolio data
 */
async function fetchPortfolio(
  address: string, 
  chains: string[]
): Promise<PortfolioData> {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Use TypeScript interfaces for props
- Follow component file structure:
  ```typescript
  // 1. Imports
  // 2. Type definitions
  // 3. Component definition
  // 4. Export
  ```
- Use descriptive prop names
- Keep components small and reusable
- Add PropTypes or TypeScript interfaces

**Example:**
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary',
  disabled = false 
}) => {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
};

export default Button;
```

### Solidity

- Follow Solidity style guide
- Use OpenZeppelin contracts where possible
- Add NatSpec comments
- Include comprehensive tests
- Run static analysis tools

**Example:**
```solidity
/// @title ChainMind Token
/// @author ChainMind Team
/// @notice ERC20 token with staking and governance
/// @dev Implements staking rewards and voting mechanisms
contract ChainMindToken is ERC20, Ownable {
    /// @notice Stakes tokens for rewards
    /// @param amount Amount of tokens to stake
    /// @dev Transfers tokens from user to contract
    function stake(uint256 amount) external {
        require(amount > 0, "Cannot stake 0");
        // Implementation
    }
}
```

### CSS/Tailwind

- Use Tailwind utility classes
- Follow mobile-first approach
- Add dark mode support with `dark:` prefix
- Use consistent spacing scale
- Group related classes

**Example:**
```tsx
<div className="
  flex items-center justify-between
  p-4 sm:p-6 lg:p-8
  bg-white dark:bg-gray-800
  rounded-lg shadow-sm
  hover:shadow-md transition-shadow
">
  {/* Content */}
</div>
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Frontend Tests

```bash
cd frontend
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Smart Contract Tests

```bash
cd contracts
npm test                # Run all tests
npm run coverage        # Coverage report
npm run gas-report      # Gas usage report
```

### Test Guidelines

- Write tests for all new features
- Maintain at least 80% code coverage
- Test both success and error cases
- Use descriptive test names
- Mock external dependencies

**Example:**
```typescript
describe('ChatService', () => {
  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      // Test implementation
    });
    
    it('should handle API errors gracefully', async () => {
      // Test implementation
    });
    
    it('should validate message length', async () => {
      // Test implementation
    });
  });
});
```

## 📚 Documentation

- Update README.md for major features
- Add inline comments for complex logic
- Update API documentation
- Include examples in documentation
- Keep documentation up to date

## 🔍 Code Review Process

1. Automated checks must pass:
   - Linting
   - Type checking
   - Tests
   - Build

2. At least one maintainer approval required

3. Review criteria:
   - Code quality and style
   - Test coverage
   - Documentation
   - Performance impact
   - Security considerations

## 🎯 Areas for Contribution

### High Priority
- [ ] Improve AI response accuracy
- [ ] Add more blockchain networks
- [ ] Enhance security scanning
- [ ] Performance optimizations
- [ ] Mobile app development

### Medium Priority
- [ ] Additional language support
- [ ] More DeFi protocol integrations
- [ ] Advanced portfolio analytics
- [ ] Social features
- [ ] Notification system

### Low Priority
- [ ] UI/UX improvements
- [ ] Documentation enhancements
- [ ] Additional test coverage
- [ ] Code refactoring
- [ ] Developer tooling

## 📞 Getting Help

- **Discord**: [Join our community](https://discord.gg/chainmind)
- **GitHub Discussions**: Ask questions and share ideas
- **Twitter**: [@ChainMindAI](https://twitter.com/ChainMindAI)
- **Email**: dev@chainmind.ai

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Eligible for community rewards (future)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to ChainMind! 🧠⛓️
