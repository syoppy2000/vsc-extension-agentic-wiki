# Change Log

All notable changes to the "Agentic Wiki" extension will be documented in this file.

## [0.0.3] - 2025-05-03

### Security

- Implemented secure API key storage using VS Code's Secret Storage API
- Added automatic migration of existing API keys from global state to secure storage
- Removed API key from shared state to prevent exposure

### Code Quality

- Refactored duplicate code into utility functions for language handling and file formatting
- Updated language dropdown in configuration UI to make English the default first option
- Improved error messages for missing or invalid API keys

## [0.0.2] - 2025-05-03

### Added

- Support for multiple languages in generated documentation
- Improved caching mechanism for LLM responses
- Enhanced error handling for API calls

## [0.0.1] - 2025-05-03

### Added

- Initial release
- Configuration panel functionality
- Wiki generation feature
- Wiki viewing capability

## [Unreleased]

### Planned

- Improved UX for configuration panel
- Enhanced error handling
- Visualization flow improvements
