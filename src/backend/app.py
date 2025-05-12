import os
from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Flask: serve React SPA and enable CORS
build_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '../../frontend/public')
)
app = Flask(__name__, static_folder=build_path, static_url_path='')
CORS(app)

# Plumber API base URL
PLUMBER_URL = 'http://localhost:8000'

@app.route('/start', methods=['GET'])
def start_test():
    """
    Forward GET /start to Plumber POST /start. Returns initial item and session_id.
    Support optional theta0 parameter for testing.
    """
    try:
        # Check for optional theta0 parameter
        theta0 = request.args.get('theta0')
        payload = {}
        if theta0:
            # Parse theta0 if provided (e.g., "0.5,0.3,-0.2,0.1")
            try:
                theta_values = [float(x.strip()) for x in theta0.split(',')]
                payload['theta0'] = theta_values
            except ValueError:
                logger.warning(f"Invalid theta0 format: {theta0}")
        
        resp = requests.post(f"{PLUMBER_URL}/start", json=payload)
        return jsonify(resp.json()), resp.status_code
    except requests.RequestException as e:
        logger.error(f"Error connecting to Plumber API: {e}")
        return jsonify({'error': 'API connection failed'}), 500

@app.route('/next', methods=['POST'])
def next_item():
    """
    Receives JSON containing session_id, item_index, answer (letter or index),
    and elapsed_time. Normalize fields and forward to Plumber /next endpoint.
    """
    try:
        data = request.get_json(force=True)
        logger.info(f">>> Flask /next received: {data}")
        
        # Extract and normalize data
        sid = data['session_id']
        idx = data['item_index']
        answer = data['answer']
        elapsed_time = data.get('elapsed_time', 0)  # Optional timing data
        
        # Handle list format (unboxed JSON might still produce lists)
        if isinstance(sid, list):
            sid = sid[0]
        if isinstance(idx, list):
            idx = idx[0]
        
        # Map answer letter (A-D) to index 1-4
        if isinstance(answer, str) and answer.upper() in ['A', 'B', 'C', 'D']:
            answer = ord(answer.upper()) - ord('A') + 1
        
        try:
            payload = {
                'session_id': sid,
                'item_index': int(idx),
                'answer': int(answer),
                'elapsed_time': float(elapsed_time)
            }
        except (ValueError, TypeError) as e:
            logger.error(f"Invalid parameters: {e}")
            return jsonify({'error': 'Invalid parameters'}), 400
        
        resp = requests.post(f"{PLUMBER_URL}/next", json=payload)
        response_data = resp.json()
        
        # Log response for debugging
        logger.info(f">>> Plumber response: {response_data}")
        
        return jsonify(response_data), resp.status_code
        
    except requests.RequestException as e:
        logger.error(f"Error connecting to Plumber API: {e}")
        return jsonify({'error': 'API connection failed'}), 500
    except KeyError as e:
        logger.error(f"Missing required field: {e}")
        return jsonify({'error': f'Missing required field: {e}'}), 400

@app.route('/session-end', methods=['POST'])
def session_end():
    """
    Forward session end notification to Plumber to update item history.
    Includes total time information.
    """
    try:
        data = request.get_json(force=True)
        logger.info(f">>> Flask /session-end received: {data}")
        
        resp = requests.post(f"{PLUMBER_URL}/session-end", json=data)
        return jsonify(resp.json()), resp.status_code
        
    except requests.RequestException as e:
        logger.error(f"Error connecting to Plumber API: {e}")
        return jsonify({'error': 'API connection failed'}), 500

@app.route('/images/<path:filename>')
def serve_images(filename):
    """
    Serve question images from data/images (.jpg files)
    """
    img_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), '../../data/images')
    )
    return send_from_directory(img_dir, filename)

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to verify API connectivity
    """
    try:
        # Try to ping Plumber API
        resp = requests.get(f"{PLUMBER_URL}/", timeout=5)
        if resp.status_code == 200:
            return jsonify({'status': 'healthy', 'plumber': 'connected'}), 200
        else:
            return jsonify({'status': 'unhealthy', 'plumber': 'disconnected'}), 503
    except:
        return jsonify({'status': 'unhealthy', 'plumber': 'disconnected'}), 503

# Serve React SPA for all other routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path):
    """
    Serve React Single Page Application
    """
    target = os.path.join(app.static_folder, path)
    if path and os.path.exists(target):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Print startup information
    print("="*50)
    print("MCAT Flask Proxy Server")
    print(f"Static folder: {build_path}")
    print(f"Plumber API URL: {PLUMBER_URL}")
    print("="*50)
    
    # Run Flask proxy on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)