// Κοινές συναρτήσεις κρυπτογράφησης για τη σύνδεση με όνομα χρήστη/κωδικό.
// Το GitHub token αποθηκεύεται στο admin/login.json ΚΡΥΠΤΟΓΡΑΦΗΜΕΝΟ (AES-GCM).
// Το κλειδί βγαίνει από «όνομα χρήστη + κωδικό» με PBKDF2 (600.000 επαναλήψεις),
// οπότε χωρίς τα σωστά στοιχεία το token δεν μπορεί να διαβαστεί.
var MathAuth = (function () {
  "use strict";
  var ITER = 600000;
  var enc = new TextEncoder();

  function b64(buf) {
    var s = "", bytes = new Uint8Array(buf);
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }
  function unb64(str) {
    var s = atob(str), out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  function secret(user, pass) {
    return enc.encode(String(user).trim().toLowerCase() + "\u0000" + String(pass));
  }
  function deriveKey(user, pass, salt, iter) {
    return crypto.subtle.importKey("raw", secret(user, pass), "PBKDF2", false, ["deriveKey"]).then(function (base) {
      return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: salt, iterations: iter, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
      );
    });
  }

  function encrypt(token, user, pass) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return deriveKey(user, pass, salt, ITER).then(function (key) {
      return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(token));
    }).then(function (ct) {
      return { v: 1, kdf: "PBKDF2-SHA256", iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(ct) };
    });
  }

  // Επιστρέφει το token, ή απορρίπτεται αν τα στοιχεία είναι λάθος.
  function decrypt(box, user, pass) {
    return deriveKey(user, pass, unb64(box.salt), box.iter || ITER).then(function (key) {
      return crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(box.iv) }, key, unb64(box.data));
    }).then(function (pt) {
      return new TextDecoder().decode(pt);
    });
  }

  return { encrypt: encrypt, decrypt: decrypt };
})();
