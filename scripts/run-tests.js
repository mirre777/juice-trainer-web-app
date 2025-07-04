// Self-contained test script for unified services migration
const https = require("https")
const http = require("http")

class TestRunner {
  constructor() {
    this.baseUrl = "http://localhost:3000"
    this.testResults = []
    this.authToken = null
    this.testUserId = null
    this.testClientId = null
  }

  async makeRequest(path, method = "GET", data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + path)
      const options = {
        hostname: url.hostname,
        port: url.port || 3000,
        path: url.pathname + url.search,
        method: method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      }

      if (this.authToken) {
        options.headers["Authorization"] = `Bearer ${this.authToken}`
      }

      const req = http.request(options, (res) => {
        let body = ""
        res.on("data", (chunk) => {
          body += chunk
        })
        res.on("end", () => {
          try {
            const jsonBody = body ? JSON.parse(body) : {}
            resolve({
              status: res.statusCode,
              data: jsonBody,
              headers: res.headers,
            })
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: body,
              headers: res.headers,
            })
          }
        })
      })

      req.on("error", (err) => {
        reject(err)
      })

      if (data) {
        req.write(JSON.stringify(data))
      }

      req.end()
    })
  }

  logTest(name, passed, message = "") {
    const status = passed ? "✅ PASS" : "❌ FAIL"
    console.log(`${status}: ${name}${message ? " - " + message : ""}`)
    this.testResults.push({ name, passed, message })
  }

  async testHealthCheck() {
    try {
      const response = await this.makeRequest("/api/health")
      this.logTest("Health Check", response.status === 200, `Status: ${response.status}`)
      return response.status === 200
    } catch (error) {
      this.logTest("Health Check", false, `Error: ${error.message}`)
      return false
    }
  }

  async testSignup() {
    try {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: "testpassword123",
        name: "Test Trainer",
        role: "trainer",
      }

      const response = await this.makeRequest("/api/auth/signup", "POST", userData)
      const success = response.status === 201 || response.status === 200

      if (success && response.data.user) {
        this.testUserId = response.data.user.id
        this.authToken = response.data.token
      }

      this.logTest("User Signup", success, `Status: ${response.status}`)
      return success
    } catch (error) {
      this.logTest("User Signup", false, `Error: ${error.message}`)
      return false
    }
  }

  async testLogin() {
    try {
      const loginData = {
        email: `test-${Date.now()}@example.com`,
        password: "testpassword123",
      }

      // First create a user to login with
      await this.makeRequest("/api/auth/signup", "POST", {
        ...loginData,
        name: "Test User",
        role: "trainer",
      })

      const response = await this.makeRequest("/api/auth/login", "POST", loginData)
      const success = response.status === 200

      if (success && response.data.token) {
        this.authToken = response.data.token
        this.testUserId = response.data.user?.id
      }

      this.logTest("User Login", success, `Status: ${response.status}`)
      return success
    } catch (error) {
      this.logTest("User Login", false, `Error: ${error.message}`)
      return false
    }
  }

  async testGetCurrentUser() {
    try {
      const response = await this.makeRequest("/api/auth/me")
      const success = response.status === 200 && response.data.user
      this.logTest("Get Current User", success, `Status: ${response.status}`)
      return success
    } catch (error) {
      this.logTest("Get Current User", false, `Error: ${error.message}`)
      return false
    }
  }

  async testGetClients() {
    try {
      const response = await this.makeRequest("/api/clients")
      const success = response.status === 200 && Array.isArray(response.data.clients)
      this.logTest("Get Clients", success, `Status: ${response.status}, Count: ${response.data.clients?.length || 0}`)
      return success
    } catch (error) {
      this.logTest("Get Clients", false, `Error: ${error.message}`)
      return false
    }
  }

  async testAddClient() {
    try {
      const clientData = {
        name: "Test Client",
        email: `client-${Date.now()}@example.com`,
        phone: "+1234567890",
        goals: "Weight loss",
      }

      const response = await this.makeRequest("/api/clients", "POST", clientData)
      const success = response.status === 201 || response.status === 200

      if (success && response.data.client) {
        this.testClientId = response.data.client.id
      }

      this.logTest("Add Client", success, `Status: ${response.status}`)
      return success
    } catch (error) {
      this.logTest("Add Client", false, `Error: ${error.message}`)
      return false
    }
  }

  async testGetSpecificClient() {
    if (!this.testClientId) {
      this.logTest("Get Specific Client", false, "No test client ID available")
      return false
    }

    try {
      const response = await this.makeRequest(`/api/clients/${this.testClientId}`)
      const success = response.status === 200 && response.data.client
      this.logTest("Get Specific Client", success, `Status: ${response.status}`)
      return success
    } catch (error) {
      this.logTest("Get Specific Client", false, `Error: ${error.message}`)
      return false
    }
  }

  async testUpdateClient() {
    if (!this.testClientId) {
      this.logTest("Update Client", false, "No test client ID available")
      return false
    }

    try {
      const updates = {
        name: "Updated Test Client",
        goals: "Muscle gain",
      }

      const response = await this.makeRequest(`/api/clients/${this.testClientId}`, "PUT", updates)
      const success = response.status === 200
      this.logTest("Update Client", success, `Status: ${response.status}`)
      return success
    } catch (error) {
      this.logTest("Update Client", false, `Error: ${error.message}`)
      return false
    }
  }

  async testDeleteClient() {
    if (!this.testClientId) {
      this.logTest("Delete Client", false, "No test client ID available")
      return false
    }

    try {
      const response = await this.makeRequest(`/api/clients/${this.testClientId}`, "DELETE")
      const success = response.status === 200 || response.status === 204
      this.logTest("Delete Client", success, `Status: ${response.status}`)
      return success
    } catch (error) {
      this.logTest("Delete Client", false, `Error: ${error.message}`)
      return false
    }
  }

  async testUnauthorizedAccess() {
    try {
      const originalToken = this.authToken
      this.authToken = null // Remove auth token

      const response = await this.makeRequest("/api/clients")
      const success = response.status === 401

      this.authToken = originalToken // Restore token
      this.logTest("Unauthorized Access", success, `Status: ${response.status}`)
      return success
    } catch (error) {
      this.logTest("Unauthorized Access", false, `Error: ${error.message}`)
      return false
    }
  }

  async testLogout() {
    try {
      const response = await this.makeRequest("/api/auth/logout", "POST")
      const success = response.status === 200

      if (success) {
        this.authToken = null
      }

      this.logTest("User Logout", success, `Status: ${response.status}`)
      return success
    } catch (error) {
      this.logTest("User Logout", false, `Error: ${error.message}`)
      return false
    }
  }

  async runAllTests() {
    console.log("🚀 Starting Unified Services Migration Tests...\n")

    const tests = [
      () => this.testHealthCheck(),
      () => this.testSignup(),
      () => this.testLogin(),
      () => this.testGetCurrentUser(),
      () => this.testGetClients(),
      () => this.testAddClient(),
      () => this.testGetSpecificClient(),
      () => this.testUpdateClient(),
      () => this.testUnauthorizedAccess(),
      () => this.testDeleteClient(),
      () => this.testLogout(),
    ]

    let passed = 0
    let failed = 0

    for (const test of tests) {
      try {
        const result = await test()
        if (result) passed++
        else failed++
      } catch (error) {
        console.log(`❌ FAIL: Test error - ${error.message}`)
        failed++
      }

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log("\n📊 TEST SUMMARY:")
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)

    if (failed === 0) {
      console.log("\n🎉 All tests passed! Migration is successful.")
    } else {
      console.log("\n⚠️  Some tests failed. Please check the implementation.")
    }

    return failed === 0
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner()
  runner.runAllTests().catch(console.error)
}

module.exports = TestRunner
