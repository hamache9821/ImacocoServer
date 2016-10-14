// ニックネームに使えない文字をチェックする
function checkInvalidCharNickname(t){
    return t.match(/[<>\"\\]/) == null;
}

function checkInvalidCharUserID(t){
    t = t.replace(/[a-zA-Z0-9!@#$%^()-=_.,]+/g,'');
    return t == '';
}

// Google Maps APIがないときにXmlHTTPRequestを使う
function createHttpRequest(){
    //Win ie用
    if(window.ActiveXObject){
        try{
            //MSXML2以降用
            return new ActiveXObject("Msxml2.XMLHTTP")
        }
        catch (e){
            try{
                //旧MSXML用
                return new ActiveXObject("Microsoft.XMLHTTP")
            }
            catch (e2){
                return null
            }
         }
    }
    else if(window.XMLHttpRequest){
        //Win ie以外のXMLHttpRequestオブジェクト実装ブラウザ用
        return new XMLHttpRequest()
    }
    else{
        return null
    }
}

function setPublicFlag(obj, id){
    var request = createHttpRequest();
    request.open("GET", "/user/set_public?id="+id+"&flag="+ (obj.checked ? "1" : "0") + "&t="+ new Date().getTime(), true);
    request.onreadystatechange = function(){
        if (request.readyState == 4){
            if (request.status != 200 || request.responseText == ""){
                alert('サーバでエラーが発生しました');
                return false;
            }
            
            var d = eval(request.responseText);
            if (!d) {
                setPublicFlag(obj, id);
                return;
            }
            if (d.result){
                alert('更新しました');
            }
            else{
                alert('サーバでエラーが発生しました');
            }
        }
    }
    request.send("");
    return false;
}

function deleteAll(){
    var request = createHttpRequest();
    request.open("GET", "/user/delete_all_data?t="+ new Date().getTime(), true);
    request.onreadystatechange = function() 
    {
        if (request.readyState == 4) {
            if (request.status != 200 || request.responseText == "")
            {
                alert('サーバでエラーが発生しました');
                return false;
            }
            var d = eval(request.responseText);
            if (d.result){
                alert('削除しました');
                location.reload(true);
            }
            else{
                alert('サーバでエラーが発生しました');
            }
        }
    }
    request.send("");
    return false;
}

function createUserInfo(){
    var email = document.getElementById("email");
    if (!email){
        alert("id='email' not found in form element.");
        return false;
    }

    var nickname = document.getElementById("nickname");
    if (!nickname){
        alert("id='nickname' not found in form element.");
        return false;
    }

    var username = document.getElementById("username");
    if (!username){
        alert("id='username' not found in form element.");
        return false;
    }

    var passwd = document.getElementById("password");
    if (!passwd){
        alert("id='password' not found in form element.");
        return false;
    }

    var passwd2 = document.getElementById("password2");
    if (!passwd2){
        alert("id='password2' not found in form element.");
        return false;
    }

    if (email.value == ""){
        alert('メールアドレスは必須です');
        return false;
    }

    if (!checkInvalidCharNickname(nickname.value)){
        alert('ニックネームに<>"\\は使えません');
        return false;
    }

    if (username == ""){
        alert('ユーザーIDは必須です');
        return false;
    }

    if (!checkInvalidCharUserID(username.value)){
        alert('ユーザー名に使える文字は英数字と!@#$%^()-=_.,だけです');
        return false;
    }

    if (passwd.value == ""){
        alert('パスワードは必須です');
        return false;
    }

    if (passwd.value.length > 0 && passwd.value != passwd2.value){
        alert('確認パスワードが一致しません');
        return false;
    }

    if (passwd.value != passwd2.value){
        alert('確認パスワードが一致しません');
        return false;
    }

    var request = createHttpRequest();
    var data =
        "&email=" + encodeURIComponent(email.value) +
        "&nickname=" + encodeURIComponent(nickname.value) +
        "&username=" + encodeURIComponent(username.value) +
        "&password=" + encodeURIComponent(passwd.value) +
        "&password2=" + encodeURIComponent(passwd2.value);
    request.open("POST", "/create_user", false);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    request.send(data);

    if (request.status != 200 || request.responseText == ""){
        alert('サーバでエラーが発生しました');
        return false;
    }
    var d = eval(request.responseText);
    if (d.result){
        alert('作成しました');
    } else {
        alert('サーバでエラーが発生しました' + (d.errmsg ? ': ' + d.errmsg : ''));
    }
    return false;
}

function updateUserInfo(){
    var locapos_token = document.getElementById("locapos_token");

    var nickname = document.getElementById("nickname");
    if (!nickname){
        alert("id='nickname' not found in form element.");
        return false;
    }

    var ust = document.getElementById("ust");
    if (!ust){
        alert("id='ust' not found in form element.");
        return false;
    }

    var show = document.getElementById("show");
    if (!show){
        alert("id='show' not found in form element.");
        return false;
    }

    var web = document.getElementById("web");
    if (!web){
        alert("id='web' not found in form element.");
        return false;
    }

    var twitter = document.getElementById("twitter");
    if (!twitter){
        alert("id='twitter' not found in form element.");
        return false;
    }

    var speed = document.getElementById("speed");
    if (!speed){
        alert("id='speed' not found in form element.");
        return false;
    }

    var description = document.getElementById("description");
    if (!description){
        alert("id='description' not found in form element.");
        return false;
    }

    var popup = document.getElementById("popup");
    if (!popup){
        alert("id='popup' not found in form element.");
        return false;
    }

    if (!checkInvalidCharNickname(nickname.value)){
        alert("<>\"\\は使用できません");
        return false;
    }

    var jtv = document.getElementById("jtv");
    if (!jtv){
        alert("id='jtv' not found in form element.");
        return false;
    }

    var nicolive = document.getElementById("nicolive");
    if (!nicolive){
        alert("id='nicolive' not found in form element.");
        return false;
    }

    var passwd = document.getElementById("password");
    var passwd2 = document.getElementById("password2");

    if (passwd.value.length > 0 && passwd.value != passwd2.value){
        alert('確認パスワードが一致しません');
        return false;
    }

    if (nicolive.value.length > 0 && !nicolive.value.match("^[0-9]+$")){
        alert("ニコニコ動画IDは数字のみ指定可能です");
        return false;
    }

    var request = createHttpRequest();
    var data = "nickname=" + encodeURIComponent(nickname.value) + 
        "&ust=" + encodeURIComponent(ust.value) +
        "&jtv=" + encodeURIComponent(jtv.value) +
        "&nicolive=" + encodeURIComponent(nicolive.value) +
        (show.checked ? "&show=1" : "&show=0") +
        (speed.checked ? "&speed=1" : "&speed=0") +
        "&web=" + encodeURIComponent(web.value) +
        "&twitter=" + encodeURIComponent(twitter.value) +
        "&description=" + encodeURIComponent(description.value) +
        "&popup=" + encodeURIComponent(popup.value) +
        "&password=" + encodeURIComponent(passwd.value) +
        "&password2=" + encodeURIComponent(passwd2.value) +
        "&locapos_token=" + encodeURIComponent(locapos_token.value);
    request.open("POST", "/user/update_userinfo", false);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    request.send(data);

    if (request.status != 200 || request.responseText == ""){
        alert('サーバでエラーが発生しました');
        return false;
    }
    var d = eval(request.responseText);
    if (d.result){
        alert('更新しました');
    } else {
        alert('サーバでエラーが発生しました' + (d.errmsg ? ': ' + d.errmsg : ''));
    }
    return false;
}

function deleteData(id){
    var request = createHttpRequest();
    request.open("GET", "/user/delete_data?id="+id + "&t="+ new Date().getTime() , false);
    request.send("");
    if (request.status != 200 || request.responseText == ""){
        alert('サーバでエラーが発生しました');
        return false;
    }
    var d = eval(request.responseText);
    if (d.result){
        alert('削除しました');
        location.reload(true);
    } else {
        alert('削除に失敗しました');
    }
    return false;
}

function deleteGroup(id){
    var request = createHttpRequest();
    request.open("GET", "/user/deletegroup?group=" + id + "&t=" + new Date().getTime(), false);
    request.send("");
    if (request.status != 200 || request.responseText == ""){
        alert('サーバでエラーが発生しました');
        return false;
    }
    var d = eval(request.responseText);
    if (d.result){
        alert('削除しました');
        location.reload(true);
    } else {
        alert('失敗しました：' + d.errmsg);
    }
    return false;
}

function createGroup(){
    var group = document.getElementById("group");
    if (!group){
        alert("id='group' not found in form element.");
        return false;
    }

    var desc = document.getElementById("description");
    if (!desc){
        alert("id='desc' not found in form element.");
        return false;
    }

    var request = createHttpRequest();
    var data = "group=" + encodeURIComponent(group.value) + "&desc=" + encodeURIComponent(desc.value);
    request.open("POST", "/user/creategroup", false);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    request.send(data);
    if (request.status != 200 || request.responseText == ""){
        alert('サーバでエラーが発生しました');
        return false;
    }
    var d = eval(request.responseText);
    if (d.result){
        alert('作成しました');
        return true;
    }

    alert('失敗しました：' + d.errmsg);
    return false;
}

// ユーザー一覧をサーバから取得する
function getUserList(){
    var request = createHttpRequest();
    request.open("GET", "/api/user_list?id="+ new Date().getTime() , false);
    request.send("");

    if (request.status != 200 || request.responseText == ""){
        alert('サーバでエラーが発生しました');
        return false;
    }

    var d = eval(request.responseText);
    if (d.result){
        return d.list;
    }
    return null;
}

function getGroupInfo(id){
    var request = createHttpRequest();
    request.open("GET", "/api/getgroupinfo?group=" + id + "&t=" + new Date().getTime(), false);
    request.send("");
    if (request.status != 200 || request.responseText == ""){
        alert('サーバでエラーが発生しました');
        return false;
    }
    var d = eval(request.responseText);
    return d;
}

function updateGroupInfo(){
    var group = document.getElementById("group");
    if (!group){
        alert("id='group' not found in form element.");
        return false;
    }

    var desc = document.getElementById("description");
    if (!desc){
        alert("id='desc' not found in form element.");
        return false;
    }

    var list2 = document.getElementById("list2");
    if (!list2){
        alert("id='list2' not found in form element.");
        return false;
    }

    var users = "";
    for (var i=0; i<list2.options.length-1; i++){
        users += list2.options[i].value + ",";
    }
    users += list2.options[list2.options.length-1].value;

    var request = createHttpRequest();
    var data = "group=" + encodeURIComponent(group.innerText) + "&desc=" + encodeURIComponent(desc.value) + "&users=" + users;
    request.open("POST", "/user/updategroup", false);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    request.send(data);
    if (request.status != 200 || request.responseText == ""){
        alert('サーバでエラーが発生しました');
        return false;
    }
    var d = eval(request.responseText);
    if (d.result){
        alert('更新しました');
        return true;
    }

    alert('失敗しました：' + d.errmsg);
    return false;
}

function getLocaposToken(){
    var q = location.hash.slice(1);
    if (q.length == 0 ){ return; }

    var a = q.split('&');
    var access_token = '';
    var userid = '';

    for (var i = 0 ; i < a.length - 1 ; i++){
        if (a[i].lastIndexOf('access_token', 0) === 0){
            var x = a[i].split('=');
            access_token = x[1];

        } else if (a[i].lastIndexOf('state', 0) === 0){
            var x = a[i].split('=');
            userid =x[1];
        }
    }
    document.getElementById("locapos_token").value = access_token;
}
