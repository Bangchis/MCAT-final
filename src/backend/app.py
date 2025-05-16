# import os
# from flask import Flask, send_from_directory, jsonify, request
# from flask_cors import CORS
# import requests
# import logging

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # Configure Flask: serve React SPA and enable CORS
# build_path = os.path.abspath(
#     os.path.join(os.path.dirname(__file__), '../../frontend/public')
# )
# app = Flask(__name__, static_folder=build_path, static_url_path='')
# CORS(app)

# # Plumber API base URL (đọc từ env, fallback về r-service)
# PLUMBER_URL = os.getenv('PLUMBER_URL', 'http://r-service:8000')

# @app.route('/start', methods=['GET'])
# def start_test():
#     """
#     Forward GET /start to Plumber POST /start.
#     """
#     try:
#         theta0 = request.args.get('theta0')
#         payload = {}
#         if theta0:
#             try:
#                 payload['theta0'] = [float(x.strip()) for x in theta0.split(',')]
#             except ValueError:
#                 logger.warning(f"Invalid theta0 format: {theta0}")

#         resp = requests.post(f"{PLUMBER_URL}/start", json=payload)
#         return jsonify(resp.json()), resp.status_code

#     except requests.RequestException as e:
#         logger.error(f"Error connecting to Plumber API: {e}")
#         return jsonify({'error': 'API connection failed'}), 500

# @app.route('/next', methods=['POST'])
# def next_item():
#     """
#     Forward POST /next to Plumber /next.
#     """
#     try:
#         data = request.get_json(force=True)
#         logger.info(f">>> Flask /next received: {data}")

#         sid       = data.get('session_id')
#         idx       = data.get('item_index')
#         answer    = data.get('answer')
#         elapsed_t = data.get('elapsed_time', 0)

#         # Normalize list-wrapped params
#         if isinstance(sid, list):       sid = sid[0]
#         if isinstance(idx, list):       idx = idx[0]
#         if isinstance(answer, list):    answer = answer[0]

#         # Map A-D -> 1-4
#         if isinstance(answer, str) and answer.upper() in ['A','B','C','D']:
#             answer = ord(answer.upper()) - ord('A') + 1

#         payload = {
#             'session_id': sid,
#             'item_index': int(idx),
#             'answer':    int(answer),
#             'elapsed_time': float(elapsed_t)
#         }

#         resp = requests.post(f"{PLUMBER_URL}/next", json=payload)
#         data = resp.json()
#         logger.info(f">>> Plumber response: {data}")
#         return jsonify(data), resp.status_code

#     except KeyError as e:
#         logger.error(f"Missing required field: {e}")
#         return jsonify({'error': f'Missing field {e}'}), 400
#     except requests.RequestException as e:
#         logger.error(f"Error connecting to Plumber API: {e}")
#         return jsonify({'error': 'API connection failed'}), 500

# @app.route('/session-end', methods=['POST'])
# def session_end():
#     """
#     Forward POST /session-end to Plumber /session-end.
#     """
#     try:
#         data = request.get_json(force=True)
#         logger.info(f">>> Flask /session-end received: {data}")

#         resp = requests.post(f"{PLUMBER_URL}/session-end", json=data)
#         return jsonify(resp.json()), resp.status_code

#     except requests.RequestException as e:
#         logger.error(f"Error connecting to Plumber API: {e}")
#         return jsonify({'error': 'API connection failed'}), 500

# @app.route('/images/<path:filename>')
# def serve_images(filename):
#     """
#     Serve question images from mounted data/images.
#     """
#     # WORKDIR is /app, data mounted at /app/data
#     img_dir = os.path.join(os.getcwd(), 'data', 'images')
#     return send_from_directory(img_dir, filename)

# @app.route('/health', methods=['GET'])
# def health_check():
#     """
#     Health check for Flask → Plumber.
#     """
#     try:
#         resp = requests.get(f"{PLUMBER_URL}/", timeout=5)
#         status = 'connected' if resp.status_code == 200 else 'disconnected'
#         code   = 200 if status=='connected' else 503
#         return jsonify({'status':'healthy' if status=='connected' else 'unhealthy',
#                         'plumber':status}), code
#     except:
#         return jsonify({'status':'unhealthy','plumber':'disconnected'}), 503

# # Serve React SPA
# @app.route('/', defaults={'path':''})
# @app.route('/<path:path>')
# def serve_spa(path):
#     target = os.path.join(app.static_folder, path)
#     if path and os.path.exists(target):
#         return send_from_directory(app.static_folder, path)
#     return send_from_directory(app.static_folder, 'index.html')

# if __name__ == '__main__':
#     print("="*50)
#     print("MCAT Flask Proxy Server")
#     print(f"Static folder: {build_path}")
#     print(f"Plumber API URL: {PLUMBER_URL}")
#     print("="*50)
#     app.run(host='0.0.0.0', port=5000, debug=True)

import os
import logging
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# --- Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configure HTTP session for proxying to Plumber ---
# connection pooling + simple retry strategy
plumber_session = requests.Session()
retries = Retry(
    total=3,
    backoff_factor=0.3,
    status_forcelist=[500, 502, 503, 504],
    allowed_methods=["GET", "POST"]
)
adapter = HTTPAdapter(pool_connections=50, pool_maxsize=50, max_retries=retries)
plumber_session.mount('http://', adapter)
plumber_session.mount('https://', adapter)

PLUMBER_URL = os.getenv('PLUMBER_URL', 'http://r-service:8000')
REQUEST_TIMEOUT = 5  # seconds

# --- Flask setup ---
build_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '../../frontend/build')
)
app = Flask(__name__, static_folder=build_path, static_url_path='')
CORS(app)

# --- Endpoints ---
@app.route('/start', methods=['GET'])
def start_test():
    theta0 = request.args.get('theta0', None)
    payload = {}
    if theta0:
        try:
            payload['theta0'] = [float(x.strip()) for x in theta0.split(',')]
        except ValueError:
            logger.warning(f"Invalid theta0: {theta0}")

    try:
        resp = plumber_session.post(
            f"{PLUMBER_URL}/start",
            json=payload,
            timeout=REQUEST_TIMEOUT
        )
        return jsonify(resp.json()), resp.status_code
    except requests.RequestException as e:
        logger.error(f"/start → Plumber error: {e}")
        return jsonify({'error': 'API connection failed'}), 502

@app.route('/next', methods=['POST'])
def next_item():
    data = request.get_json(force=True)
    logger.info(f">>> /next received: {data}")

    # normalize
    sid = data.get('session_id')
    idx = data.get('item_index')
    ans = data.get('answer')
    elapsed_t = data.get('elapsed_time', 0)

    # unwrap lists
    if isinstance(sid, list): sid = sid[0]
    if isinstance(idx, list): idx = idx[0]
    if isinstance(ans, list): ans = ans[0]

    # letter→number
    if isinstance(ans, str) and ans.upper() in ['A','B','C','D']:
        ans = ord(ans.upper()) - ord('A') + 1

    try:
        payload = {
            'session_id':    str(sid),
            'item_index':    int(idx),
            'answer':        int(ans),
            'elapsed_time':  float(elapsed_t)
        }
    except (TypeError, ValueError) as e:
        logger.error(f"Invalid payload: {e}")
        return jsonify({'error': 'Bad request'}), 400

    try:
        resp = plumber_session.post(
            f"{PLUMBER_URL}/next",
            json=payload,
            timeout=REQUEST_TIMEOUT
        )
        data = resp.json()
        logger.info(f">>> Plumber response: {data}")
        return jsonify(data), resp.status_code
    except requests.RequestException as e:
        logger.error(f"/next → Plumber error: {e}")
        return jsonify({'error': 'API connection failed'}), 502

@app.route('/session-end', methods=['POST'])
def session_end():
    data = request.get_json(force=True)
    logger.info(f">>> /session-end received: {data}")

    try:
        resp = plumber_session.post(
            f"{PLUMBER_URL}/session-end",
            json=data,
            timeout=REQUEST_TIMEOUT
        )
        return jsonify(resp.json()), resp.status_code
    except requests.RequestException as e:
        logger.error(f"/session-end → Plumber error: {e}")
        return jsonify({'error': 'API connection failed'}), 502

@app.route('/images/<path:filename>')
def serve_images(filename):
    img_dir = os.path.join(os.getcwd(), 'data', 'images')
    return send_from_directory(img_dir, filename)

@app.route('/health', methods=['GET'])
def health_check():
    try:
        r = plumber_session.get(f"{PLUMBER_URL}/", timeout=REQUEST_TIMEOUT)
        ok = (r.status_code == 200)
        return jsonify({
            'status': 'healthy' if ok else 'unhealthy',
            'plumber': 'connected' if ok else 'disconnected'
        }), (200 if ok else 503)
    except:
        return jsonify({'status':'unhealthy','plumber':'disconnected'}), 503

# Serve React SPA
@app.route('/', defaults={'path':''})
@app.route('/<path:path>')
def serve_spa(path):
    target = os.path.join(app.static_folder, path)
    if path and os.path.exists(target):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    logger.info("="*50)
    logger.info("MCAT Flask Proxy Server")
    logger.info(f"Static folder : {build_path}")
    logger.info(f"Plumber URL   : {PLUMBER_URL}")
    logger.info("="*50)
    # bật threaded để phục vụ nhiều kết nối cùng lúc
    app.run(host='0.0.0.0', port=5000, threaded=True)
