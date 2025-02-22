from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/generate-description', methods=['POST'])
def generate_description():
    data = request.json
    prompt = data.get('prompt', '')
    description = "Descrição gerada pela IA"
    return jsonify({"description": description})

if __name__ == '__main__':
    app.run(port=5000)