from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pickle
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# Load Model
model = pickle.load(open("credit_model.pkl", "rb"))

# Load Scaler
scaler = pickle.load(open("scaler.pkl", "rb"))

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        print("Incoming data:", data)

        # Get Inputs (already numeric from form)
        age = float(data['age'])
        income = float(data['income'])
        loan = float(data['loan'])
        credit = float(data['credit'])
        employment = float(data['employment'])
        education = float(data['education'])
        housing = float(data['housing'])

        # Feature Order Must Match Training
        raw_features = [age, income, loan, credit, employment, education, housing]
        print("Raw features:", raw_features)
        features = np.array([[age, income, loan, credit, employment, education, housing]])
        print("Features before scaling:", features)

        # Apply Scaling
        features = scaler.transform(features)

        # Prediction
        prediction = model.predict(features)
        predicted_value = int(prediction[0])

        # Result Message - 1=Approved, 0=Denied
        if predicted_value == 1:
            status = "Approved ✅"
        else:
            status = "High Risk - Denied ❌"

        return jsonify({
            "prediction": predicted_value,
            "status": status
        })

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({
            "error": str(e)
        }), 400

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

