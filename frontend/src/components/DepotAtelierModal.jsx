import { useState, useRef } from 'react';
import { X, Camera, Check, FileText, QrCode, ChevronRight, Upload } from 'lucide-react';
import { interventions as interventionsAPI } from '../services/api';

const DepotAtelierModal = ({ show, onClose, intervention, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [accessoires, setAccessoires] = useState([]);
  const [qrCodeData, setQrCodeData] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const accessoiresList = [
    'Chargeur',
    'Câble d\'alimentation',
    'Batterie',
    'Télécommande',
    'Manuel d\'utilisation',
    'Boîte d\'origine',
    'Adaptateur',
    'Câbles divers',
    'Carte mémoire',
    'Sacoche/Housse',
    'Clés/Outils',
    'Accessoires spécifiques'
  ];

  const handlePhotoCapture = async (e) => {
    const files = Array.from(e.target.files);
    const photoPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    const photoData = await Promise.all(photoPromises);
    setPhotos([...photos, ...photoData]);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const toggleAccessoire = (accessoire) => {
    if (accessoires.includes(accessoire)) {
      setAccessoires(accessoires.filter(a => a !== accessoire));
    } else {
      setAccessoires([...accessoires, accessoire]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await interventionsAPI.completeDepotAtelier(intervention._id, {
        photosDepot: photos,
        accessoiresDepot: accessoires
      });

      setQrCodeData(response.data);
      setCurrentStep(4);
      onSuccess?.();
    } catch (error) {
      console.error('Erreur lors du dépôt atelier:', error);
      alert('Erreur lors de l\'enregistrement du dépôt');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setPhotos([]);
    setAccessoires([]);
    setQrCodeData(null);
    onClose();
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeData.qrCodeUrl;
    link.download = `QR-${intervention.numero}.png`;
    link.click();
  };

  const downloadFicheDA = () => {
    window.open(qrCodeData.ficheDAUrl, '_blank');
  };

  if (!show) return null;

  return (
    <div className="modal-container" onClick={handleClose}>
      <div
        className="card modal-content animate-slide-in"
        style={{
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-6)',
          paddingBottom: 'var(--space-4)',
          borderBottom: '2px solid var(--neutral-200)'
        }}>
          <div>
            <h2 style={{ marginBottom: 'var(--space-2)' }}>Dépôt Atelier</h2>
            <p style={{ color: 'var(--neutral-600)', fontSize: '0.875rem' }}>
              {intervention.clientId?.nom} {intervention.clientId?.prenom} - {intervention.appareil?.type}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 'var(--space-2)',
              color: 'var(--neutral-600)'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Steps indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-8)',
          position: 'relative'
        }}>
          {/* Progress line */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '10%',
            right: '10%',
            height: '2px',
            background: 'var(--neutral-200)',
            zIndex: 0
          }}>
            <div style={{
              height: '100%',
              background: 'var(--primary-500)',
              width: `${((currentStep - 1) / 3) * 100}%`,
              transition: 'width var(--transition-base)'
            }} />
          </div>

          {[
            { num: 1, label: 'Photos', icon: Camera },
            { num: 2, label: 'Accessoires', icon: Check },
            { num: 3, label: 'Validation', icon: FileText },
            { num: 4, label: 'QR Code', icon: QrCode }
          ].map(({ num, label, icon: Icon }) => (
            <div
              key={num}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                position: 'relative',
                zIndex: 1
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: currentStep >= num ? 'var(--primary-500)' : 'var(--neutral-200)',
                color: currentStep >= num ? 'white' : 'var(--neutral-600)',
                marginBottom: 'var(--space-2)',
                transition: 'all var(--transition-base)'
              }}>
                <Icon size={20} />
              </div>
              <span style={{
                fontSize: '0.75rem',
                color: currentStep >= num ? 'var(--primary-500)' : 'var(--neutral-600)',
                fontWeight: currentStep === num ? '600' : '400',
                textAlign: 'center'
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Photos */}
        {currentStep === 1 && (
          <div>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Photos de l'appareil au dépôt</h3>
            <p style={{ color: 'var(--neutral-600)', marginBottom: 'var(--space-6)', fontSize: '0.875rem' }}>
              Prenez plusieurs photos de l'appareil pour documenter son état à la réception
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-6)'
            }}>
              {photos.map((photo, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    paddingTop: '100%',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    style={{
                      position: 'absolute',
                      top: 'var(--space-2)',
                      right: 'var(--space-2)',
                      background: 'var(--red-500)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                style={{ display: 'none' }}
                onChange={handlePhotoCapture}
              />
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
              >
                <Camera size={20} />
                Prendre une photo
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handlePhotoCapture}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
              >
                <Upload size={20} />
                Choisir des photos
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button onClick={handleClose} className="btn btn-secondary">
                Annuler
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className="btn btn-primary"
                disabled={photos.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                Suivant
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Accessoires */}
        {currentStep === 2 && (
          <div>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Accessoires remis</h3>
            <p style={{ color: 'var(--neutral-600)', marginBottom: 'var(--space-6)', fontSize: '0.875rem' }}>
              Sélectionnez tous les accessoires remis avec l'appareil
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-6)'
            }}>
              {accessoiresList.map((accessoire) => (
                <label
                  key={accessoire}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-3)',
                    background: accessoires.includes(accessoire) ? 'var(--primary-50)' : 'var(--neutral-50)',
                    border: `2px solid ${accessoires.includes(accessoire) ? 'var(--primary-500)' : 'var(--neutral-200)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={accessoires.includes(accessoire)}
                    onChange={() => toggleAccessoire(accessoire)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '0.875rem' }}>{accessoire}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
              <button onClick={() => setCurrentStep(1)} className="btn btn-secondary">
                Retour
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                Suivant
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Validation */}
        {currentStep === 3 && (
          <div>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Validation du dépôt</h3>
            <p style={{ color: 'var(--neutral-600)', marginBottom: 'var(--space-6)', fontSize: '0.875rem' }}>
              Vérifiez les informations avant de générer la fiche de dépôt atelier
            </p>

            <div className="card" style={{ background: 'var(--neutral-50)', marginBottom: 'var(--space-6)' }}>
              <h4 style={{ marginBottom: 'var(--space-3)' }}>Résumé</h4>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <strong>Photos :</strong> {photos.length} photo{photos.length > 1 ? 's' : ''}
              </div>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <strong>Accessoires remis :</strong>
                {accessoires.length === 0 ? (
                  <span style={{ color: 'var(--neutral-600)', fontStyle: 'italic' }}> Aucun</span>
                ) : (
                  <ul style={{ marginTop: 'var(--space-2)', marginLeft: 'var(--space-6)' }}>
                    {accessoires.map(acc => (
                      <li key={acc} style={{ marginBottom: 'var(--space-1)' }}>{acc}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div style={{
              padding: 'var(--space-4)',
              background: 'var(--blue-50)',
              border: '1px solid var(--blue-500)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-6)'
            }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--blue-600)' }}>
                ℹ️ Une fiche de dépôt atelier (DA) sera automatiquement générée avec un QR code pour suivre l'intervention.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
              <button onClick={() => setCurrentStep(2)} className="btn btn-secondary" disabled={loading}>
                Retour
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                {loading ? 'Génération...' : 'Valider et générer'}
                <FileText size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: QR Code & Fiche DA */}
        {currentStep === 4 && qrCodeData && (
          <div>
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-8)',
              background: 'var(--primary-50)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-6)'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'var(--primary-500)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-4)'
              }}>
                <Check size={40} style={{ color: 'white' }} />
              </div>
              <h3 style={{ color: 'var(--primary-500)', marginBottom: 'var(--space-2)' }}>
                Dépôt atelier enregistré !
              </h3>
              <p style={{ color: 'var(--neutral-600)' }}>
                La fiche DA et le QR code ont été générés avec succès
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-6)'
            }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <QrCode size={48} style={{ color: 'var(--primary-500)', margin: '0 auto var(--space-3)' }} />
                <h4 style={{ marginBottom: 'var(--space-2)' }}>QR Code</h4>
                <img
                  src={qrCodeData.qrCodeUrl}
                  alt="QR Code"
                  style={{
                    width: '200px',
                    height: '200px',
                    margin: '0 auto var(--space-4)',
                    display: 'block'
                  }}
                />
                <button onClick={downloadQRCode} className="btn btn-secondary" style={{ width: '100%' }}>
                  Télécharger QR Code
                </button>
              </div>

              <div className="card" style={{ textAlign: 'center' }}>
                <FileText size={48} style={{ color: 'var(--primary-500)', margin: '0 auto var(--space-3)' }} />
                <h4 style={{ marginBottom: 'var(--space-4)' }}>Fiche DA</h4>
                <p style={{ color: 'var(--neutral-600)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
                  Document de dépôt atelier complet avec photos et accessoires
                </p>
                <button onClick={downloadFicheDA} className="btn btn-primary" style={{ width: '100%' }}>
                  Télécharger Fiche DA
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={handleClose} className="btn btn-primary" style={{ minWidth: '200px' }}>
                Terminer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepotAtelierModal;
