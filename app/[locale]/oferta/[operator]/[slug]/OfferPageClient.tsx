"use client";
import { useState } from "react";
import ContactForm from "./ContactForm";
import AddressValidator from "./AddressValidator";
import RewardsModule from "./RewardsModule";

interface Props {
  offer: any;
  addressData: { miejscowosc: string; ulica?: string; nr?: string; miejscowoscSlug?: string; simc?: string } | null;
}

export default function OfferPageClient({ offer, addressData: initialAddressData }: Props) {
  const [addressData, setAddressData] = useState(initialAddressData);
  
  const isAddressComplete = addressData?.miejscowosc && addressData?.nr;

  const handleAddressComplete = (newAddress: { miejscowosc: string; ulica: string; nr: string }) => {
    setAddressData({
      ...addressData,
      ...newAddress
    });
  };

  return (
    <div className="space-y-6">
      {isAddressComplete ? (
        <ContactForm offer={offer} addressData={addressData} />
      ) : addressData?.miejscowosc && addressData?.simc ? (
        <AddressValidator 
          miejscowosc={addressData.miejscowosc}
          miejscowoscSlug={addressData.miejscowoscSlug || ''}
          simc={addressData.simc}
          offer={offer}
          onAddressComplete={handleAddressComplete}
        />
      ) : (
        <ContactForm offer={offer} addressData={null} />
      )}
      <RewardsModule operatorName={offer.operator.nazwa} operatorSlug={offer.operator.slug} />
    </div>
  );
}