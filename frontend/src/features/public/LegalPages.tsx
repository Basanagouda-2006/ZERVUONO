import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="py-12 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 leading-relaxed">
      <h1 className="text-3xl font-extrabold text-brand-evergreen dark:text-white mb-6">
        Privacy Policy
      </h1>
      <div className="prose dark:prose-invert text-xs sm:text-sm text-brand-forest/80 dark:text-brand-dark-muted space-y-4">
        <p>Last updated: October 2026</p>
        <p>
          At Zervuno, we take data privacy and operational security seriously. This Privacy Policy describes how we collect, use, and protect your information when using our maintenance operations SaaS platform.
        </p>
        <h3 className="text-base font-bold text-brand-evergreen dark:text-brand-mint pt-2">
          1. Information We Collect
        </h3>
        <p>
          We collect organizational details, user identities, maintenance records, equipment telemetry, work orders, photos, and location tags submitted by authorized users within your tenancy.
        </p>
        <h3 className="text-base font-bold text-brand-evergreen dark:text-brand-mint pt-2">
          2. Tenant Data Isolation
        </h3>
        <p>
          All organization data is strictly partitioned by tenant ID at the database layer. No cross-organizational data sharing or exposure occurs.
        </p>
        <h3 className="text-base font-bold text-brand-evergreen dark:text-brand-mint pt-2">
          3. Security Practices
        </h3>
        <p>
          We employ Argon2id cryptographic password hashing, HttpOnly session cookies, encrypted TLS in transit, and role-based access control.
        </p>
      </div>
    </div>
  );
};

export const TermsOfService: React.FC = () => {
  return (
    <div className="py-12 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 leading-relaxed">
      <h1 className="text-3xl font-extrabold text-brand-evergreen dark:text-white mb-6">
        Terms of Service
      </h1>
      <div className="prose dark:prose-invert text-xs sm:text-sm text-brand-forest/80 dark:text-brand-dark-muted space-y-4">
        <p>Last updated: October 2026</p>
        <p>
          By accessing or using Zervuno, you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a company or other legal entity, you represent that you have the authority to bind such entity.
        </p>
        <h3 className="text-base font-bold text-brand-evergreen dark:text-brand-mint pt-2">
          1. Permitted Use
        </h3>
        <p>
          Zervuno is provided solely for legitimate facility, logistics, equipment, and asset maintenance operations by authorized organizational members.
        </p>
        <h3 className="text-base font-bold text-brand-evergreen dark:text-brand-mint pt-2">
          2. Account Responsibilities
        </h3>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your user identity.
        </p>
      </div>
    </div>
  );
};
