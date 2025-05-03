# Agentic Wiki

Agentic Wiki is an agentic wiki generator for your Git codebase. It automatically analyzes your repository and creates comprehensive documentation that evolves with your code.

## Features

- **Automated Documentation**: Generate wiki content directly from your codebase
- **Intelligent Analysis**: Leverages AI to understand code relationships and architecture
- **Git Integration**: Stays in sync with your repository changes
- **Customizable Output**: Configure the depth and focus of your documentation

![Agentic Wiki in action](images/preview.png)

## Requirements

- VS Code 1.99.0 or higher
- Git repository
- Internet connection for AI processing

## Extension Settings

This extension contributes the following settings:

- `agenticWiki.apiKey`: Your OpenAI API key for generating documentation
- `agenticWiki.outputPath`: Path where the wiki will be generated
- `agenticWiki.excludePatterns`: Patterns to exclude from documentation
- `agenticWiki.includePrivate`: Whether to include private methods and classes

## Commands

- `Agentic Wiki: Config`: Open the configuration panel
- `Agentic Wiki: Generate`: Generate or update the wiki
- `Agentic Wiki: Open`: Open the generated wiki

## Getting Started

1. Install the extension
2. Run the `Agentic Wiki: Config` command to set up your API key and preferences
3. Run `Agentic Wiki: Generate` to create your wiki
4. Use `Agentic Wiki: Open` to view the generated documentation

## Extension Development

### Building the Extension

```bash
# Install dependencies
pnpm install

# Compile the extension
pnpm run compile

# Package the extension
pnpm run package
```
