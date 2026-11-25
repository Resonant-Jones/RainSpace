"""Run inside the disposable Chromium container started by verify-origins.sh."""

from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import subprocess
import tempfile
from threading import Thread


class Storefront(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/videos":
            self.path = "/index.html"
        super().do_GET()

    def log_message(self, *args):
        pass


class Catalogue(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = set()
        self.words = []

    def handle_starttag(self, tag, attrs):
        href = dict(attrs).get("href", "")
        if tag == "a" and href.startswith("/videos/"):
            self.links.add(href)

    def handle_data(self, data):
        self.words.append(data)


for port in (5173, 8888):
    server = ThreadingHTTPServer(("127.0.0.1", port), partial(Storefront, directory="/site"))
    Thread(target=server.serve_forever, daemon=True).start()
    for host in ("localhost", "127.0.0.1"):
        url = f"http://{host}:{port}/videos"
        # The disposable container owns this profile. Chromium child processes
        # may still be closing it after the headless parent exits.
        profile = tempfile.mkdtemp()
        result = subprocess.run(["chromium", "--headless", "--no-sandbox", "--disable-dev-shm-usage",
                                 "--disable-gpu", "--no-proxy-server", f"--user-data-dir={profile}",
                                 "--virtual-time-budget=6000", "--dump-dom", url],
                                capture_output=True, text=True, timeout=120, check=True)
        page = Catalogue()
        page.feed(result.stdout)
        text = " ".join(page.words)
        print(url, sorted(page.links), flush=True)
        assert "Catalogue source · Live API" in text and "Catalogue" in text
        assert page.links == {"/videos/night-bus-short-film", "/videos/field-recording-notes",
                              "/videos/keyboard-mechanics"}, result.stdout
