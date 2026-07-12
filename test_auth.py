import subprocess
import json

def run_cpp(module, action, params):
    param_str = json.dumps(params)
    cmd = ["stayspace_core.exe", module, action, param_str]
    print(f"Running command: {' '.join(cmd)}")
    
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    
    # Print stdout and stderr
    print("STDOUT:")
    print(result.stdout)
    print("STDERR:")
    print(result.stderr)

if __name__ == "__main__":
    print("--- Testing C++ Registration ---")
    reg_params = {
        "name": "Alice Test",
        "email": "alice@test.com",
        "password": "Alice@1234",
        "role": "Guest"
    }
    run_cpp("auth", "register", reg_params)
    
    print("\n--- Testing C++ Login ---")
    login_params = {
        "email": "alice@test.com",
        "password": "Alice@1234"
    }
    run_cpp("auth", "login", login_params)
