# ⚙️ n8n: Workflow Automation Platform

n8n (pronounced "nodemation") is a powerful, open-source, node-based workflow automation tool. It allows you to connect different applications and services, sync data between them, and design complex automated processes using a visual interface, without extensive coding.

## 🚀 Why Use n8n?

*   **Visual Workflow Builder:** Design complex automations by connecting nodes representing different applications or logic steps (if/else, loops, data transformation).
*   **Extensive Integrations:** Supports hundreds of popular apps and services out of the box (databases, APIs, cloud services, communication tools, etc.).
*   **Extensibility:** Create custom nodes (using JavaScript/TypeScript) to integrate with any API or service not natively supported.
*   **Self-Hosting Option:** As an open-source tool, you can host n8n on your own infrastructure (servers, Docker) for full control over data and costs. A cloud version is also available.
*   **Fair-Code License:** Source code is available, allowing modification and self-hosting, but with some commercial restrictions (see n8n license details).
*   **MCP Integration:** Can act as an MCP (Model Context Protocol) server, allowing AI agents to trigger n8n workflows as tools (see [../session-notes/MCP/04-N8N-ServerNode.md](../session-notes/MCP/04-N8N-ServerNode.md)).
*   **Cost-Effective:** Self-hosting can be significantly cheaper than many SaaS automation platforms, especially at scale.

## 🛠️ Installation / Setup

You can run n8n in several ways:

1.  **n8n Cloud:** The official hosted platform (paid, with a trial).
    *   Sign up at [https://n8n.io/](https://n8n.io/)
    *   Easiest way to get started, handles infrastructure for you.

2.  **Self-Hosting with Docker (Recommended for Control):**
    *   **Prerequisites:** Docker installed (see [Docker.md](./Docker.md)).
    *   **Run Command:**
        ```bash
        docker run -it --rm \
          --name n8n \
          -p 5678:5678 \
          -v n8n_data:/home/node/.n8n \
          docker.n8n.io/n8nio/n8n
        ```
        *   `-it`: Interactive terminal.
        *   `--rm`: Remove container when stopped.
        *   `--name n8n`: Assign a name to the container.
        *   `-p 5678:5678`: Map port 5678 on your host to port 5678 in the container.
        *   `-v n8n_data:/home/node/.n8n`: Create a Docker volume named `n8n_data` to persist your workflow data even if the container is removed.
    *   **Access:** Open your browser to `http://localhost:5678`.

3.  **Self-Hosting with `npx` (Quick Test / Temporary):**
    *   **Prerequisites:** Node.js and npm installed (see [../foundational/JavaScript.md](../foundational/JavaScript.md)).
    *   **Run Command:**
        ```bash
        npx n8n
        ```
        *   Downloads and runs n8n temporarily without a full installation.
        *   **Data is not persisted** by default when using `npx` unless you configure external storage. Good for quick tests.
    *   **Access:** Open your browser to `http://localhost:5678`.

## 💡 Getting Started

1.  **Access the n8n UI:** Open `http://localhost:5678` (or your n8n Cloud URL).
2.  **Create Your First Workflow:**
    *   Click "New Workflow".
    *   The starting point is usually a **Trigger node**. This defines how the workflow starts (e.g., on a schedule, via webhook, manually).
    *   Click the `+` button to add nodes. Search for the app or service you want to connect (e.g., "Gmail", "HTTP Request", "Supabase", "IF").
3.  **Configure Nodes:**
    *   **Credentials:** Most nodes connecting to external services require credentials. Click "Create New" in the Credentials section of a node and follow the authentication prompts (often involves OAuth2 or API keys).
    *   **Parameters:** Fill in the required fields for the node's operation (e.g., recipient email address for Gmail, URL for HTTP Request).
4.  **Connect Nodes:** Drag the small circle from the edge of one node to the edge of the next node to define the data flow.
5.  **Use Expressions:** Access data from previous nodes using expressions. Click the "fx" button or the gears icon in a field. Use syntax like `{{ $json.propertyName }}` or `{{ $node["Node Name"].json.propertyName }}` to reference data.
6.  **Test Your Workflow:**
    *   Click "Test Workflow" to run it manually with sample data.
    *   Examine the output of each node to ensure data is flowing correctly.
7.  **Activate Your Workflow:** Once tested, toggle the "Active" switch to ON. The workflow will now run based on its trigger condition.

## 📚 Help & Resources

*   **Official n8n Documentation:** [https://docs.n8n.io/](https://docs.n8n.io/)
*   **n8n Community Forum:** Active place for questions, examples, and discussions. [https://community.n8n.io/](https://community.n8n.io/)
*   **n8n Website & Blog:** [https://n8n.io/](https://n8n.io/)
*   **List of Integrations:** [https://n8n.io/integrations/](https://n8n.io/integrations/)
*   **YouTube Channel:** Tutorials and demos. [https://www.youtube.com/c/n8nio](https://www.youtube.com/c/n8nio)

## ✅ Next Steps

*   Explore different trigger nodes (Schedule, Webhook, Cron).
*   Learn about data transformation nodes (Set, Function, Edit Fields).
*   Implement error handling workflows.
*   Try connecting n8n to databases like Supabase or other APIs.
*   Set up n8n as an MCP server to integrate with AI agents.

---
*Licensed under the [Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/)*
*Visit [ProductFoundry.ai](https://productfoundry.ai)*