import dayjs from "dayjs";

export function formatTime(dateString) {
    if (!dateString) return "";
    return dayjs(dateString).format('YY/MM/DD hh:mm A');
}


