# Agentic Wiki (Beta)

Agentic Wiki is an intelligent documentation generator for your codebase. It automatically analyzes your repository structure, identifies key abstractions, and creates comprehensive, beginner-friendly documentation that explains your code architecture.

## Features

- **AI-Powered Documentation**: Generate detailed wiki content directly from your codebase
- **Intelligent Code Analysis**: Leverages AI to understand code relationships and architecture
- **Abstraction Identification**: Automatically identifies key concepts and abstractions in your code
- **Relationship Mapping**: Analyzes and visualizes relationships between different components
- **Multi-Language Support**: Generate documentation in multiple languages
- **Model Selection**: Choose from various AI models through OpenRouter API, with free options available
- **Customizable Output**: Configure the depth and focus of your documentation

![Agentic Wiki in action]

## Requirements

- VS Code 1.99.0 or higher
- Internet connection for AI processing
- OpenRouter API key (free tier available)

## Extension Settings

The extension can be configured through the configuration panel:

- **API Key**: Your OpenRouter API key for accessing AI models
- **Model Selection**: Choose from various AI models, with free options prioritized
- **Output Directory**: Where the wiki will be generated
- **Include/Exclude Patterns**: Control which files are included in the analysis
- **Language**: Select the output language for the generated documentation
- **Caching**: Enable/disable caching of AI responses for faster generation

## Commands

- `Agentic Wiki: Config`: Open the configuration panel
- `Agentic Wiki: Generate`: Generate or update the wiki
- `Agentic Wiki: Open`: Open the generated wiki

## Getting Started

1. **Install the extension** from the VS Code Marketplace
2. **Open the configuration panel** by running the `Agentic Wiki: Config` command from the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
3. **Set up your OpenRouter API key**:
    - If you don't have an OpenRouter API key, click the link in the configuration panel to create one
    - OpenRouter provides free access to various AI models
    - Copy your API key and paste it into the configuration panel
4. **Select an AI model** from the dropdown list (free models are listed first)
5. **Configure other settings** according to your preferences:
    - Set the output directory for your wiki
    - Specify include/exclude patterns to control which files are analyzed
    - Choose your preferred language for the documentation
6. **Generate your wiki** by running the `Agentic Wiki: Generate` command
7. **View the documentation** by running the `Agentic Wiki: Open` command

![Configuration Panel]

## Generated Documentation

Agentic Wiki generates comprehensive documentation that explains your codebase in a beginner-friendly way:

### Documentation Structure

- **Index Page**: Overview of all identified abstractions with links to detailed chapters
- **Abstraction Chapters**: Detailed explanation of each key concept in your codebase
- **Relationship Diagrams**: Visual representations of how different components interact
- **Code Examples**: Simplified code snippets with explanations
- **Navigation Links**: Easy navigation between related concepts

The documentation is generated as Markdown files, making it easy to read directly in VS Code or export to other formats.

![Generated Documentation]

### Key Features of the Generated Documentation

- **Beginner-Friendly Explanations**: Complex concepts are broken down into simple explanations
- **Visual Diagrams**: Mermaid diagrams illustrate relationships and workflows
- **Contextual Understanding**: Each abstraction is explained in the context of the overall system
- **Practical Examples**: Real code examples show how to use each component
- **Consistent Structure**: Each chapter follows a consistent format for easy learning
- **Multi-Language Support**: Documentation can be generated in multiple languages:

    - English (default)
    - Chinese (中文)
    - Japanese (日本語)
    - Spanish (Español)
    - French (Français)
    - German (Deutsch)

    Each language is fully supported with proper localization of all content

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

## OpenRouter API Integration

Agentic Wiki uses the OpenRouter API to provide access to a wide range of AI models:

- **Free Tier Access**: OpenRouter provides free access to various AI models
- **Model Selection**: Choose from different models based on your needs
- **Prioritized Free Models**: Free models are listed first in the selection dropdown
- **Simple Setup**: Just provide your API key and select a model

To get an OpenRouter API key:

1. Visit [OpenRouter Keys](https://openrouter.ai/keys)
2. Create a free account
3. Generate an API key
4. Copy the key to the Agentic Wiki configuration panel

## License

This extension is released under the MIT License. See the LICENSE file for details.

---

**Note**: This extension is currently in beta. We welcome your feedback and suggestions for improvement!

[Report Issues](https://github.com/fine405/vsc-extension-agentic-wiki/issues) | [Contribute](https://github.com/fine405/vsc-extension-agentic-wiki)
