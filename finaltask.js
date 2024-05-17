import http from "k6/http";
import { check, group, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";


export function handleSummary(data) {
    return {
        'report.html': htmlReport(data),
        stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}

export let options = {
    vus: 1000, // Jumlah Virtual Users (VU)
    duration: '2m', // Durasi Uji Coba
    iterations:3500,
    thresholds: {
        http_req_duration: ['p(95)<2000'],  // Batas maksimum toleransi API
        http_req_failed: ["rate<0.01"],     // Tingkat kegagalan permintaan HTTP
        'http_req_duration{scenario:default}': [`max>=2000`],
        'iteration_duration{group:::POST /api/users}': [`max>=0`],

    },
};

export default function () {
    const url = "https://reqres.in/api";
    
    const payload1 = JSON.stringify({
        name: "Morpheus",
        job: "Leader"
    });

    const payload2 = JSON.stringify({
        name: "Morpheus",
        job: "zion resident"
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    group("POST /api/users with valid data", function () {
        // POST request to add a new user
        const postRes = http.post(`${url}/users`, payload1, params);

        // Validate the response code
        check(postRes, {
            "is status 201": r => r.status === 201
        });
    }, {tags: {name:'POST /api/users'}} );



    group("PUT /api/users/:id with existing id", () => {
            // PUT request to update an existing user
            const putRes = http.put(`${url}/users/2`, payload2, params);

            // Check that the request was successful
            check(putRes, {
                "is status 200": r => r.status === 200
            });

            // Validate the response code and body
            check(putRes, {
                "is status 200": r => r.status === 200,
                "returns correct values": r => {
                    const got =putRes.json();
                    return (got.name === "Morpheus") && (got.job === "zion resident");
            }
        });
    });

   sleep(0.5);
    
}
