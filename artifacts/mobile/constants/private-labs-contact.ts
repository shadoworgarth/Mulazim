export interface LabContact {
  phones?: string[];
  emails?: string[];
  website?: string;
  address?: string;
}

export const LAB_CONTACTS: Record<number, LabContact> = {
  1: {
    phones: ["0555078615", "0555123063"],
    emails: ["maldawaleebi@mfco.com.sa", "aalghunaim@mfco.com.sa"],
    website: "www.motabaqah.com.sa",
    address: "جدة",
  },
  2: {
    phones: ["0533334627", "0114633332"],
    emails: ["honeyqualitylab@yahoo.com", "dr.ibrahimalarify@yahoo.com"],
    website: "https://www.honey-ql.com/main-ar/",
    address: "الرياض",
  },
  3: {
    phones: ["8001238001", "0535800123"],
    emails: ["BA.Aldossary@IdAC.COM.SA", "Customercare@idac.com.sa"],
    website: "https://www.idac.com.sa/",
    address: "الخرج - مخرج 9",
  },
  4: {
    phones: ["11 246 6830"],
    emails: ["abdullah.salloutah@alsarabia.com", "Faisal.Alghamdi@alsarabia.com"],
    website: "www.alsarabia.com",
    address: "الدمام",
  },
  5: {
    phones: ["0533062828", "0558643355"],
    emails: ["Bd@saudiajal.com"],
    website: "http://www.saudiajal.com/",
    address: "الرياض",
  },
  6: {
    phones: ["0563101282", "0505604790"],
    emails: ["salghamdi@confirmationlab.com.sa", "maljadani@confirmationlab.com.sa"],
    address: "جدة",
  },
  7: {
    phones: ["0567288944"],
    emails: ["yasser.haseeb@bureauveritas.com", "bvksafoodlab@bureauveritas.com"],
    website: "https://commodities.bureauveritas.com/",
    address: "جدة - شارع الأمير عبدالمجيد",
  },
  8: {
    phones: ["0505461582"],
    emails: ["khaled.m@lamdalab.net", "Naif.s@lamdalab.net"],
    address: "الرياض - العليا",
  },
  9: {
    phones: ["114655226", "0505279581"],
    emails: ["ianamlah@hasanahlabs.com", "drrafei@hasanahlabs.com"],
    website: "www.hasanahlabs.com",
    address: "الرياض - حي الربيع",
  },
  10: {
    phones: ["0563827305"],
    emails: ["aalkibsi@motabaqah.com.sa", "malaa@milabs.com.sa"],
    website: "www.motabaqah.com.sa",
    address: "جدة",
  },
  11: {
    phones: ["012 233 9400 Ext. 6344", "0503513913", "0535068903", "0562178011"],
    emails: [
      "clj@saudiacatering.com",
      "thamers@saudiacatering.com",
      "masoliman@saudiacatering.com",
      "hhakeem@saudiacatering.com",
    ],
    website: "www.saudiacatering.com",
    address: "جدة",
  },
  12: {
    phones: ["530550010"],
    emails: ["alfalab1.sa@gmail.com"],
    address: "الرياض",
  },
  13: {
    phones: ["0505410255", "0509314870"],
    emails: ["akhalaf@thestability.com", "qa1@thestability.com"],
    website: "https://www.thestability.com",
    address: "الرياض",
  },
};
