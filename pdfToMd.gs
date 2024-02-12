function test() {
  var pdfUrl = 'https://arxiv.org/pdf/2401.15391.pdf'; 
  Logger.log(pfdToMarkdown(pdfUrl))
}

function pfdToMarkdown(pdfUrl) {
  // Extract the filename from the PDF URL and make it safe for Google Drive
  var fileName = pdfUrl.split('/').pop().split('#')[0].split('?')[0];
  fileName = fileName.replace(/[^a-zA-Z0-9.\-_]+/g, '_'); // Making the filename safe
  fileName = fileName || 'downloaded_file.pdf'; // Fallback filename if extraction fails

  // Specify the destination folder paths
  var downloadFolderPath = '/mypdfs/downloads';

  // Create or get the destination folder for PDFs
  var downloadFolder = getOrCreateFolder(downloadFolderPath);

  // Fetch the PDF from the URL
  var response = UrlFetchApp.fetch(pdfUrl);
  var blob = response.getBlob();
  blob.setName(fileName);

  // Save the PDF to the specified Google Drive folder
  var pdfFile = downloadFolder.createFile(blob);
  Logger.log('PDF saved to Drive with ID: ' + pdfFile.getId());

  // Create a resource object for the new Google Doc
  var resource = {
    title: pdfFile.getName(),
    mimeType: MimeType.GOOGLE_DOCS,
    parents: [{ id: downloadFolder.getId() }]
  };

  // Convert the PDF to Google Docs format by copying it with the new mimeType
  var docFile = Drive.Files.copy(resource, pdfFile.getId(), { ocr: true });
  Logger.log('PDF converted to Doc with ID: ' + docFile.id);

  // Convert the Google Doc to Markdown
  var markdownContent = convertGoogleDocToMarkdown(docFile.getId());
  Logger.log('Doc converted to MD: '+ markdownContent.slice(0, 100));

  Drive.Files.remove(pdfFile.getId());
  Drive.Files.remove(docFile.getId());
  Logger.log('Files removed from drive.')

  // Return the markdown content
  return markdownContent;
}

function convertGoogleDocToMarkdown(documentId) {
  var doc = DocumentApp.openById(documentId);
  var body = doc.getBody();

  var markdown = convertElementToMarkdown(body); // Assuming this function is implemented

  return markdown;
}

/**
 * Get or create a folder by a given path.
 * @param {string} path The path of the folder, e.g., '/mypdfs/downloads'.
 * @return {Folder} The Google Drive folder object.
 */
function getOrCreateFolder(path) {
  var parts = path.split('/').filter(function(part) { return part.length > 0; });
  var folder = DriveApp.getRootFolder();
  for (var i = 0; i < parts.length; i++) {
    var nextFolders = folder.getFoldersByName(parts[i]);
    if (nextFolders.hasNext()) {
      folder = nextFolders.next();
    } else {
      folder = folder.createFolder(parts[i]);
    }
  }
  return folder;
}




function convertElementToMarkdown(element) {
  var markdown = "";
  var numChildren = element.getNumChildren();

  for (var i = 0; i < numChildren; i++) {
    var child = element.getChild(i);
    var type = child.getType();

    switch (type) {
      case DocumentApp.ElementType.PARAGRAPH:
        markdown += convertParagraphToMarkdown(child);
        break;
      case DocumentApp.ElementType.LIST_ITEM:
        markdown += convertListItemToMarkdown(child);
        break;
      case DocumentApp.ElementType.TABLE:
        markdown += convertTableToMarkdown(child);
        break;
      // Add cases for other types as needed
      default:
        // Optionally log unsupported types
        break;
    }
  }

  return markdown;
}

function convertParagraphToMarkdown(paragraph) {
  var text = paragraph.getText();
  var textStyle = paragraph.getHeading();
  switch (textStyle) {
    case DocumentApp.ParagraphHeading.HEADING1:
      return '# ' + text + '\n\n';
    case DocumentApp.ParagraphHeading.HEADING2:
      return '## ' + text + '\n\n';
    case DocumentApp.ParagraphHeading.HEADING3:
      return '### ' + text + '\n\n';
    case DocumentApp.ParagraphHeading.HEADING4:
      return '#### ' + text + '\n\n';
    case DocumentApp.ParagraphHeading.HEADING5:
      return '##### ' + text + '\n\n';
    case DocumentApp.ParagraphHeading.HEADING6:
      return '###### ' + text + '\n\n';
    case DocumentApp.ParagraphHeading.NORMAL:
    default:
      return text + '\n\n';
  }
}

function convertListItemToMarkdown(listItem) {
  var text = listItem.getText();
  var prefix = '';
  var glyphType = listItem.getGlyphType();

  // Determine the list type (ordered or unordered)
  switch (glyphType) {
    case DocumentApp.GlyphType.BULLET:
    case DocumentApp.GlyphType.HOLLOW_BULLET:
    case DocumentApp.GlyphType.SQUARE_BULLET:
      prefix = '* ';
      break;
    case DocumentApp.GlyphType.NUMBER:
      prefix = '1. '; // Markdown will auto-increment subsequent items
      break;
    default:
      prefix = '* '; // Default to bullet for unsupported types
  }

  // Calculate nesting level, if needed
  var nesting = listItem.getNestingLevel();
  for (var i = 0; i < nesting; i++) {
    prefix = '  ' + prefix; // Indent nested lists
  }

  return prefix + text + '\n';
}

function convertTableToMarkdown(table) {
  var markdown = '';
  var numRows = table.getNumRows();

  for (var i = 0; i < numRows; i++) {
    var row = table.getRow(i);
    var numCells = row.getNumCells();

    for (var j = 0; j < numCells; j++) {
      var cellText = row.getCell(j).getText();
      markdown += '| ' + cellText + ' ';
    }

    markdown += '|\n';

    // Add a header row separator for the first row
    if (i === 0) {
      for (var k = 0; k < numCells; k++) {
        markdown += '| --- ';
      }
      markdown += '|\n';
    }
  }

  return markdown + '\n'; // Add extra newline for spacing after the table
}

// Function to handle text styling within paragraphs and list items
function styleText(text, element) {
  var styledText = '';
  var textLen = element.getText().length;

  for (var i = 0; i < textLen; i++) {
    var ch = text[i];
    if (element.isBold(i)) {
      ch = '**' + ch + '**';
    }
    if (element.isItalic(i)) {
      ch = '*' + ch + '*';
    }
    // Add more styles as needed
    styledText += ch;
  }

  return styledText;
}
