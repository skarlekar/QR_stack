# QR_stack: Binary-QR Converter Suite

## Introduction

QR_stack is a comprehensive web application suite that facilitates the conversion of binary files to QR codes and vice versa. This project consists of two main components:

1. Binary to QR Code Encoder (b2qr)
2. QR Code to Binary File Decoder (qr2b)

This suite provides a unique solution for file transfer or backup using QR codes, allowing users to convert binary files into a series of QR codes and then reconstruct the original file from those QR codes.

## Components

### 1. Binary to QR Code Encoder (b2qr)

The b2qr component converts binary files into a series of QR codes. It offers the following features:

- File selection and chunking
- QR code generation for each chunk
- Sequential display of QR codes
- Adjustable display speed and chunk size
- Progress tracking and error handling

For more details, see the [b2qr README](b2qr/README.md).

### 2. QR Code to Binary File Decoder (qr2b)

The qr2b component scans and decodes QR codes to reconstruct the original binary file. Its features include:

- Camera-based QR code scanning
- Real-time QR code detection and decoding
- Progress tracking with segmented progress bar
- Estimated time remaining for file reconstruction
- Support for partial scans and resuming from missing chunks

For more details, see the [qr2b README](qr2b/README.md).

## Usage

1. To convert a binary file to QR codes, use the b2qr encoder.
2. To reconstruct a file from QR codes, use the qr2b decoder.

Both components can be accessed through the main index.html file in the root directory.

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A device with a camera (for QR code scanning in qr2b)
- Internet connection (for loading required libraries)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/QR_stack.git
   ```
2. Navigate to the project directory:
   ```
   cd QR_stack
   ```
3. Open the `index.html` file in your web browser to access both components.

## Contributing

Contributions to either component or the overall project are welcome. Please feel free to submit Pull Requests or open issues for any bugs or feature requests.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## Contact Information

For support or queries about either component or the overall project, please open an issue on the GitHub repository.
