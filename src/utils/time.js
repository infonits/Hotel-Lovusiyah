import dayjs from "dayjs";

export function formatTime(dateString) {
    if (!dateString) return "";
    return dayjs(dateString).format('DD/MM/YY hh:mm A');
}


