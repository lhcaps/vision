# Browser Use - Cursor Skill

Automates browser interactions for web testing, form filling, screenshots, and data extraction.

Use when the user needs to navigate websites, interact with web pages, fill forms, extract data, take screenshots, or automate any browser-based workflow.

## Installation

browser-use is already installed globally via `uv tool install browser-use`. The CLI is available as `browser-use`.

## Quick Start

```python
from browser_use import Agent, Browser, ChatBrowserUse
from dotenv import load_dotenv
import asyncio

load_dotenv()

async def main():
    browser = Browser()
    agent = Agent(
        task="Find the number 1 post on Show HN",
        llm=ChatBrowserUse(),
        browser=browser,
    )
    await agent.run()
```

## Core Concepts

- **Agent**: Receives a natural language task, uses vision to "see" the page, and decides actions autonomously
- **Browser**: Controls the Chromium browser instance (headless, window size, proxy, etc.)
- **LLM**: Any supported model (ChatBrowserUse recommended, also ChatAnthropic, ChatOpenAI, ChatGoogle)

## Key Patterns

### Specify Actions Directly in Task
```python
task = """
1. Go to https://quotes.toscrape.com/
2. Use extract action with query "first 3 quotes with their authors"
3. Save results to quotes.csv using write_file action
"""
```

### Cloud Browser (production, no local setup)
```python
from browser_use import Agent, Browser, ChatBrowserUse

browser = Browser(use_cloud=True)  # Stealth cloud browser
agent = Agent(task="...", llm=ChatBrowserUse(), browser=browser)
```

### Connect to Existing Chrome
```python
browser = Browser(
    executable_path='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    user_data_dir='%LOCALAPPDATA%\\Google\\Chrome\\User Data',
    profile_directory='Default',
)
```

### Custom Tools
```python
from browser_use import Tools, ActionResult

tools = Tools()

@tools.action('Get 2FA code from authenticator app')
async def get_2fa_code(browser_session):
    # Your implementation
    return ActionResult(extracted_content="123456")
```

### Structured Output
```python
from pydantic import BaseModel

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str

agent = Agent(
    task="Search for Python tutorials and return top 5 results",
    llm=ChatBrowserUse(),
    output_model_schema=SearchResult,
)
```

## CLI Commands

```bash
browser-use open https://example.com    # Navigate to URL
browser-use state                       # See clickable elements
browser-use click 5                     # Click element by index
browser-use type "Hello"                # Type text
browser-use screenshot page.png         # Take screenshot
browser-use close                       # Close browser
```

## Important Notes

- Default to `ChatBrowserUse` model — it's optimized for browser automation
- Use `use_cloud=True` for production with best stealth and no local setup
- Be specific in tasks: name actions (click, extract, scroll) rather than vague goals
- Use keyboard navigation (Tab, ArrowDown, Enter) when clicking fails
- Agent returns `AgentHistoryList` with urls(), screenshots(), extracted_content(), errors()
