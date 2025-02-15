class ApiResponse {
    constructor(data, message = "Success") {
        this.data = data;
        this.message = message;
        this.success = true;
    }
}

export default ApiResponse;