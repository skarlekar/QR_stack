# Binary File to QR Code Encoder

## Table of Contents
- [Binary File to QR Code Encoder](#binary-file-to-qr-code-encoder)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Examples](#examples)
    - [File Information QR Code](#file-information-qr-code)
    - [Data QR Codes](#data-qr-codes)
  - [Configuration](#configuration)
  - [Limitations](#limitations)
  - [Troubleshooting](#troubleshooting)
  - [FAQ](#faq)
  - [Contributing](#contributing)
  - [License](#license)
  - [Acknowledgments](#acknowledgments)
  - [Contact Information](#contact-information)

## Introduction

The Binary File to QR Code Encoder is a web-based application that converts binary files into a series of QR codes. This tool allows users to encode any file into QR codes, which can be scanned and reassembled later, providing a unique way to transfer data or create physical backups of digital files.

## Features

- Upload and encode any binary file
- Split files into customizable chunk sizes (30 to 120 bytes)
- Generate QR codes for each chunk of data
- Display QR codes sequentially with adjustable speed
- Pause, resume, and reset QR code display
- Show progress of QR code generation and display
- Initial QR code with file information
- Responsive web design for various screen sizes

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection (for loading the QR code library)

## Installation

1. Clone the repository or download the source code:
   ```
   git clone https://github.com/yourusername/binary-to-qr-encoder.git
   ```
2. Navigate to the project directory:
   ```
   cd binary-to-qr-encoder
   ```
3. Open the `index.html` file in your web browser.

## Usage

1. Open the application in your web browser.
2. Click the "Choose File" button to select a binary file.
3. Adjust the chunk size using the slider if desired.
4. Click the "Start" button to begin displaying QR codes.
5. Use the speed slider to adjust the display speed.
6. Click "Stop" to pause the display or "Reset" to start over.

## Examples

### File Information QR Code

When a file is first loaded, a QR code containing file information is displayed. This QR code encodes a JSON object with the following structure:

```
{
  "filename": "example.bin",
  "chunks": "42"
}
```

### Data QR Codes

Each subsequent QR code represents a chunk of the file data. These QR codes encode a JSON object with the following structure:

```
{
  "chunk": "1",
  "total_chunks": "42",
  "data": "base64EncodedDataString"
}
```

## Configuration

- Chunk Size: Use the "Chunk Size" slider to adjust the size of each data chunk (30 to 120 bytes).
- Display Speed: Use the "Display Speed" slider to control how quickly QR codes are displayed (-5 to 5, with 0 being the default speed).

## Limitations

- Large files may result in a very high number of QR codes.
- The application relies on client-side processing, so very large files may cause performance issues in some browsers.

## Troubleshooting

- If QR codes are not displaying, ensure you have a stable internet connection to load the QR code library.
- If the file doesn't load, check that it's not too large for your browser to handle.

## FAQ

Q: What types of files can I encode?
A: Any binary file can be encoded, including images, documents, and executables.

Q: How do I reassemble the file from QR codes?
A: A separate decoder application (not included) would be needed to scan and reassemble the QR codes back into the original file.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## Acknowledgments

- QR Code generation is powered by the [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) library.

## Contact Information

For support or queries, please open an issue on the GitHub repository.