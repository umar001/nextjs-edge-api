import toast from 'react-hot-toast';

export const toaster = (type, msg) => {
    if (type === 'success') {
        return toast.success(msg)
    } else if (type === 'error') {
        return toast.error(msg)
    }
}
export const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
}
export const randomNum = () => {
    var min = 100000;
    var max = 900000;
    var num = Math.floor(Math.random() * min) + max;
    return num;
}