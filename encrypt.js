const CryptoJS=require("crypto-js");

const local_secret_key=`h*SL7T'JH9&HY1C=}f<J+8Tm z,AWrpX3-Azzd,mZKuD2hBHH-+5H)uE)v^Z8(iJGbE~2]ZOa#/'c|ACy^VVBR.jLoVKhZDUJ:|zF9"y~>oms_9d-kp=N.&goh)e1k`
const SECRET_KEY=process.env.MESSAGMEE_SECRET_KEY ||local_secret_key;

const encryptMsg=(msg)=>{
    return CryptoJS.AES.encrypt(msg, SECRET_KEY).toString()
}

const decryptMsg=(msg)=>{
    var bytes  = CryptoJS.AES.decrypt(msg, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports={encryptMsg,decryptMsg}