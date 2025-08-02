#!/usr/bin/env python3
import http.server
import socketserver
import os

# Change to the directory containing the HTML file
os.chdir('/Users/lech/development_hub/PROJECT_lechworld')

PORT = 8888

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Test server running at http://localhost:{PORT}/")
    print(f"Open http://localhost:{PORT}/test-api.html in your browser")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down test server...")
        httpd.shutdown()