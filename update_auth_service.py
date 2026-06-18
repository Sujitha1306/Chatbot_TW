file_path = "/Users/sujitha/Documents/Trackerwave/porter-and-asset-chatbot/frontend-angular/src/app/core/services/auth.service.ts"
with open(file_path, "r") as f:
    content = f.read()

# Add getUser
old_code = """  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}"""

new_code = """  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUser(): User | null {
    return this.getStoredUser();
  }
}"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open(file_path, "w") as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Old code not found")
