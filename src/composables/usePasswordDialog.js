import { ref } from "vue";

export function usePasswordDialog() {
    const pwdDialog = ref(false);
    const pwd = ref("");
    const showPwd = ref(false);

    function open() { pwdDialog.value = true; }
    function close() { pwdDialog.value = false; pwd.value = ""; }
    function gen() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@$%*";
        let pass = "";
        for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)];
        pwd.value = pass;
    }

    return { pwdDialog, pwd, showPwd, open, close, gen };
}
