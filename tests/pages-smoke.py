import argparse
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import urlopen
from urllib.parse import urlsplit


PROJECT_PATH = "/nist-flashcards-demo"


def create_handler(site_root):
    class PagesHandler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(site_root), **kwargs)

        def translate_path(self, path):
            requested_path = urlsplit(path).path
            if requested_path == PROJECT_PATH:
                requested_path = "/"
            elif requested_path.startswith(f"{PROJECT_PATH}/"):
                requested_path = requested_path[len(PROJECT_PATH):]
            else:
                requested_path = "/__outside_project__"
            return super().translate_path(requested_path)

        def log_message(self, _format, *_args):
            pass

    return PagesHandler


def fetch(base_url, path):
    with urlopen(f"{base_url}{PROJECT_PATH}{path}") as response:
        assert response.status == 200
        return response.read()


def verify_pages_subpath(site_root):
    site_root = Path(site_root).resolve()
    server = ThreadingHTTPServer(("127.0.0.1", 0), create_handler(site_root))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    try:
        base_url = f"http://127.0.0.1:{server.server_port}"
        html = fetch(base_url, "/").decode("utf-8")
        app = fetch(base_url, "/assets/js/app.js").decode("utf-8")
        csv_data = fetch(base_url, "/data/nist_glossary.csv").decode("utf-8")
        css = fetch(base_url, "/assets/css/styles.css").decode("utf-8")

        assert "./assets/css/styles.css" in html
        assert "./assets/js/app.js" in html
        assert 'id="clear-search-button"' in html
        assert 'id="definitions" class="definition-list"' in html
        assert 'id="definition-pagination"' in html
        assert 'import { loadGlossary } from "./csv.js";' in app
        assert "createDefinitionPreview(record.definitions)" in app
        assert "getHttpsUrl(record.link)" in app
        assert "DEFINITIONS_PER_PAGE = 4" in app
        assert 'matchType === "exact-term"' in app
        assert 'term,link,abbrSyn,definitions' in csv_data
        assert "@media (max-width: 560px)" in css

        try:
            fetch(base_url, "/assets/does-not-exist.js")
        except HTTPError as error:
            assert error.code == 404
        else:
            raise AssertionError("La ruta inexistente debía responder HTTP 404.")

        print(f"GitHub Pages subpath smoke test passed: {PROJECT_PATH}/")
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


def serve_project_site(site_root, port):
    server = ThreadingHTTPServer(("127.0.0.1", port), create_handler(Path(site_root).resolve()))
    print(f"Serving {PROJECT_PATH}/ at http://127.0.0.1:{server.server_port}{PROJECT_PATH}/")
    server.serve_forever()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", default=".")
    parser.add_argument("--serve", action="store_true")
    parser.add_argument("--port", type=int, default=8766)
    args = parser.parse_args()
    if args.serve:
        serve_project_site(args.site, args.port)
    else:
        verify_pages_subpath(args.site)
