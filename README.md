# gs-pdf-to-mardown
Google App Script that takes a PDF and turn it into Markdown, useful for AI applications

# Setup
Enable the Advanced Drive Service:
1. Open your Google Apps Script project.
2. Go to the Services pane on the left side (you might have to click on the plus icon next to "Services" if it's not already expanded).
3. Click on the + Add a service button.
4. Find and select Drive API from the list of available services.
5. Click on Add.
6. Copy the pdfToMd.gs to a new file on Google App Script

# Usage

```javascript
function test() {
  var pdfUrl = 'https://arxiv.org/pdf/2401.15391.pdf'; 
  Logger.log(pfdToMarkdown(pdfUrl))
}
```
