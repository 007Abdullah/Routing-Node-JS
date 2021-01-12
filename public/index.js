const url = "http://localhost:5000"
function signup() {
    axios({
        method: 'post',
        url: "http://localhost:5000/signup",
        data: {
            uname: document.getElementById("txt_name").value,
            email: document.getElementById("txt_email").value,
            password: document.getElementById("txt_password").value,
            phone: document.getElementById("txt_number").value,
            gender: document.getElementById("gender").value
        }
    })
        .then(function (response) {
            console.log(response.data.message);
            alert(response.data.message);
            window.location.href = "login.html"
        })
        .catch(function (error) {
            console.log(error);
        });
    return false;
}

function login() {
    axios({
        method: 'post',
        url: "http://localhost:5000/login",
        data: {
            email: document.getElementById("txt_email").value,
            password: document.getElementById("txt_password").value,
        },
        withCredentials: true
    })
        .then(function (response) {
            console.log(response.data.message);
            alert(response.data.message);
            window.location.href = "profile.html";

        })
        .catch(function (error) {
            console.log(error);
        });

    return false;
}

function profile() {
    axios.get('http://localhost:5000/profile').then(resp => {
        document.getElementById("dis_name").innerHTML = resp.data.profile.uname;
        document.getElementById("dis_email").innerHTML = resp.data.profile.email;
        document.getElementById("dis_phone").innerHTML = resp.data.profile.phone;
        document.getElementById("dis_gender").innerHTML = resp.data.profile.gender;
    });
}