// src/api/chatService.js
import axiosClient from "./axiosClient";

/**
 * Usage:
 *  const api = chatService.session(sessionId) // ou chatService.group(groupId)
 *  await api.list()
 *  await api.send("hello")
 *  await api.remove(messageId)
 */

export const chatService = {
  group(groupId) {
    const base = `/groups/${groupId}/chat/`;
    return {
      async list() {
        const { data } = await axiosClient.get(base);
        return Array.isArray(data?.results) ? data.results : data;
      },
      async send(content) {
        const { data } = await axiosClient.post(base, { content });
        return data;
      },
      async remove(msgId) {
        // backend renvoie 204
        return axiosClient.delete(`${base}${msgId}/`);
      },
    };
  },

  session(sessionId) {
    const base = `/sessions/${sessionId}/chat/`;
    return {
      async list() {
        const { data } = await axiosClient.get(base);
        return Array.isArray(data?.results) ? data.results : data;
      },
      async send(content) {
        const { data } = await axiosClient.post(base, { content });
        return data;
      },
      async remove(msgId) {
        return axiosClient.delete(`${base}${msgId}/`);
      },
    };
  },
};

export default chatService;
