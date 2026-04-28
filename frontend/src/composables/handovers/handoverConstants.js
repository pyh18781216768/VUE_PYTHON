export function createHandoverForm() {
  return {
    id: "",
    title: "",
    shiftGroupId: "",
    floorId: "",
    handoverUser: "",
    receiverUser: "",
    workSummary: "",
    precautions: "",
    pendingItems: "",
    keywords: "",
    mentionUsers: [],
  };
}

export function createDefaultHandoverSorts() {
  return [
    { key: "createdAt", direction: "desc" },
    { key: "id", direction: "desc" },
  ];
}
