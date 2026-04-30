const FINES_PAGES: Record<string, ReturnType<typeof require>[]> = {
  veterinary: [
    require("@/assets/fines/veterinary/page_01.jpg"),
    require("@/assets/fines/veterinary/page_02.jpg"),
    require("@/assets/fines/veterinary/page_03.jpg"),
    require("@/assets/fines/veterinary/page_04.jpg"),
    require("@/assets/fines/veterinary/page_05.jpg"),
  ],
};

export default FINES_PAGES;
