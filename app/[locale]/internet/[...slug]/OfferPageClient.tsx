"use client";
import { useState } from "react";
import ContactForm from "./ContactForm";
import AddressValidator from "./AddressValidator";
import FullAddressSearch from "./FullAddressSearch";
import RewardsModule from "./RewardsModule";

interface AddressData {
  miejscowosc: string;
  ulica?: string;
  nr?: string;
  miejscowoscSlug?: string;
  simc?: string;
  hpCount?: number;
}

interface Props {
  offer: any;
  addressData: AddressData | null;
}

export default function OfferPageClient({ offer, addressData: initialAddressData }: Props) {
  const [addressData, setAddressData] = useState<AddressData | null>(initialAddressData);
  
  const hasAnyAddress = addressData?.miejscowosc;
  const isAddressComplete = addressData?.miejscowosc && addressData?.nr;

  const handleAddressComplete = (newAddress: AddressData) => {
    setAddressData({
      ...addressData,
      ...newAddress
    });
  };

  return (
    <div className="space-y-6">
      {isAddressComplete ? (
        <ContactForm offer={offer} addressData={addressData} />
      ) : hasAnyAddress && addressData?.simc ? (
        <AddressValidator 
          miejscowosc={addressData.miejscowosc}
          miejscowoscSlug={addressData.miejscowoscSlug || ''}
          simc={addressData.simc}
          offer={offer}
          onAddressComplete={handleAddressComplete}
        />
      ) : (
        <FullAddressSearch 
          offer={offer}
          onAddressComplete={handleAddressComplete}
        />
      )}
      <RewardsModule operatorName={offer.operator.nazwa} operatorSlug={offer.operator.slug} />
    </div>
  );
}
