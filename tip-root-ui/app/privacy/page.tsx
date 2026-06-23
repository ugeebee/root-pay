import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="bg-[#09090B] text-[#e5e1e4] flex flex-col min-h-screen font-sans overflow-hidden selection:bg-[#fbabff]/30">
      {/* Header */}
      <header className="w-full z-50 bg-transparent flex justify-between items-center px-6 md:px-12 py-6 max-w-[1280px] mx-auto">
        <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          <img src="/tipRootLogo.png" alt="Tip Root Logo" width="60" height="60" className="object-contain brightness-0 invert" />
          <div className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#fbabff] to-[#d0bcff] text-2xl md:text-3xl tracking-tight hidden sm:block">
            Tip Root
          </div>
        </Link>
        <Link href="/" className="text-[#9f8b9d] hover:text-white transition-colors font-medium">
          &larr; Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Glow Effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[400px] bg-gradient-to-r from-[#571bc1]/10 to-[#fbabff]/10 blur-[140px] rounded-full pointer-events-none"></div>

        <article className="max-w-none relative backdrop-blur-xl bg-[#fbabff]/[0.02] p-8 md:p-12 rounded-3xl border border-[#fbabff]/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fbabff] to-[#d0bcff] mb-4">
            Privacy Policy
          </h1>

          <p className="text-sm text-[#9f8b9d] mb-10">Last updated: June 16, 2026</p>

          <section className="space-y-8 text-[#e5e1e4]/90 leading-relaxed text-base md:text-lg">
            <p className="mb-4">
              This Privacy Notice for Utkarsh Gopal Bhartariya (doing business as Tip Root) (&apos;we&apos;, &apos;us&apos;, or &apos;our&apos;), describes how and why we might access, collect, store, use, and/or share (&apos;process&apos;) your personal information when you use our services (&apos;Services&apos;), including when you:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#9f8b9d] mb-4">
              <li>Visit our website at <a href="http://www.tip-root.in" className="text-[#fbabff] hover:underline">http://www.tip-root.in</a> or any website of ours that links to this Privacy Notice</li>
              <li>Download and use our mobile application (Tip Root SPC App, or any other application of ours that links to this Privacy Notice)</li>
              <li>Use Tip Real-time Open Online Tipping. Tip Root provides technology infrastructure and notification overlays that allow viewers to send tips directly to content creators via the Unified Payments Interface (UPI). We act solely as a technology provider and do not process, hold, or touch user funds at any point, nor do we act as a payment aggregator or financial intermediary.</li>
              <li>Engage with us in other related ways, including any marketing or events</li>
            </ul>
            <p className="mb-8">
              <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a href="mailto:privacy@tip-root.in" className="text-[#fbabff] hover:underline">privacy@tip-root.in</a>.
            </p>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-8">SUMMARY OF KEY POINTS</h2>
              <p className="italic text-sm text-[#9f8b9d] mb-4">
                This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for.
              </p>

              <div className="space-y-4">
                <p><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</p>
                <p><strong>Do we process any sensitive personal information?</strong> Some of the information may be considered &apos;special&apos; or &apos;sensitive&apos; in certain jurisdictions, for example your racial or ethnic origins, sexual orientation, and religious beliefs. We do not process sensitive personal information.</p>
                <p><strong>Do we collect any information from third parties?</strong> We may collect information from public databases, marketing partners, social media platforms, and other outside sources.</p>
                <p><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so.</p>
                <p><strong>In what situations and with which types of parties do we share personal information?</strong> We may share information in specific situations and with specific categories of third parties.</p>
                <p><strong>How do we keep your information safe?</strong> We have adequate organisational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorised third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.</p>
                <p><strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.</p>
                <p><strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by visiting <a href="https://tip-root.in/contact" className="text-[#fbabff] hover:underline">https://tip-root.in/contact</a>, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.</p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-8">TABLE OF CONTENTS</h2>
              <ol className="list-decimal pl-6 space-y-1 text-[#9f8b9d]">
                <li>WHAT INFORMATION DO WE COLLECT?</li>
                <li>HOW DO WE PROCESS YOUR INFORMATION?</li>
                <li>WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</li>
                <li>DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</li>
                <li>HOW DO WE HANDLE YOUR SOCIAL LOGINS?</li>
                <li>HOW LONG DO WE KEEP YOUR INFORMATION?</li>
                <li>HOW DO WE KEEP YOUR INFORMATION SAFE?</li>
                <li>DO WE COLLECT INFORMATION FROM MINORS?</li>
                <li>WHAT ARE YOUR PRIVACY RIGHTS?</li>
                <li>CONTROLS FOR DO-NOT-TRACK FEATURES</li>
                <li>DO WE MAKE UPDATES TO THIS NOTICE?</li>
                <li>HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</li>
                <li>HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</li>
              </ol>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-12">1. WHAT INFORMATION DO WE COLLECT?</h2>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">Personal information you disclose to us</h3>
              <p className="italic text-sm text-[#9f8b9d] mb-4">In Short: We collect personal information that you provide to us.</p>
              <p className="mb-4">
                We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
              </p>

              <p className="mb-4">
                <strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-[#9f8b9d] mb-4">
                <li>names</li>
                <li>email addresses</li>
                <li>phone numbers</li>
                <li>usernames</li>
                <li>contact preferences</li>
                <li>contact or authentication data</li>
                <li>upi id</li>
              </ul>

              <p className="mb-4"><strong>Sensitive Information.</strong> We do not process sensitive information.</p>

              <p className="mb-4">
                <strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases, such as your payment instrument number, and the security code associated with your payment instrument. All payment data is handled and stored by NPCI (UPI Network).
              </p>
              <p className="mb-4">
                We do not directly process, handle, or store any financial transactions, credit card numbers, or bank account details. All payments made through Tip Root are peer-to-peer (P2P) UPI transfers facilitated entirely outside of our platform through the user&apos;s chosen third-party UPI application (e.g., Google Pay, PhonePe, Paytm) and the National Payments Corporation of India (NPCI) network.
              </p>

              <p className="mb-4">
                <strong>Social Media Login Data.</strong> We may provide you with the option to register with us using your existing social media account details, like your Facebook, X, or other social media account. If you choose to register in this way, we will collect certain profile information about you from the social media provider, as described in the section called &apos;HOW DO WE HANDLE YOUR SOCIAL LOGINS?&apos; below.
              </p>

              <p className="mb-4">
                <strong>Application Data.</strong> If you use our application(s), we also may collect the following information if you choose to provide us with access or permission:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#9f8b9d] mb-4">
                <li><em>Mobile Device Access.</em> We may request access or permission to certain features from your mobile device, including your mobile device&apos;s sms messages, notifications, and other features. If you wish to change our access or permissions, you may do so in your device&apos;s settings.</li>
                <li><em>Mobile Device Data.</em> We automatically collect device information (such as your mobile device ID, model, and manufacturer), operating system, version information and system configuration information, device and application identification numbers, browser type and version, hardware model Internet service provider and/or mobile carrier, and Internet Protocol (IP) address (or proxy server). If you are using our application(s), we may also collect information about the phone network associated with your mobile device, your mobile device&apos;s operating system or platform, the type of mobile device you use, your mobile device&apos;s unique device ID, and information about the features of our application(s) you accessed.</li>
                <li><em>Push Notifications.</em> We may request to send you push notifications regarding your account or certain features of the application(s). If you wish to opt out from receiving these types of communications, you may turn them off in your device&apos;s settings.</li>
              </ul>

              <p className="mb-4">
                This information is primarily needed to maintain the security and operation of our application(s), for troubleshooting, and for our internal analytics and reporting purposes.
              </p>
              <p className="mb-4">
                All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.
              </p>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">Information automatically collected</h3>
              <p className="italic text-sm text-[#9f8b9d] mb-4">In Short: Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.</p>

              <p className="mb-4">
                We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.
              </p>
              <p className="mb-4">
                Like many businesses, we also collect information through cookies and similar technologies.
              </p>
              <p className="mb-4">The information we collect includes:</p>
              <ul className="list-disc pl-6 space-y-2 text-[#9f8b9d] mb-4">
                <li><em>Log and Usage Data.</em> Log and usage data is service-related, diagnostic, usage, and performance information our servers automatically collect when you access or use our Services and which we record in log files. Depending on how you interact with us, this log data may include your IP address, device information, browser type, and settings and information about your activity in the Services (such as the date/time stamps associated with your usage, pages and files viewed, searches, and other actions you take such as which features you use), device event information (such as system activity, error reports (sometimes called &apos;crash dumps&apos;), and hardware settings).</li>
                <li><em>Device Data.</em> We collect device data such as information about your computer, phone, tablet, or other device you use to access the Services. Depending on the device used, this device data may include information such as your IP address (or proxy server), device and application identification numbers, location, browser type, hardware model, Internet service provider and/or mobile carrier, operating system, and system configuration information.</li>
                <li><em>Location Data.</em> We collect location data such as information about your device&apos;s location, which can be either precise or imprecise. How much information we collect depends on the type and settings of the device you use to access the Services. For example, we may use GPS and other technologies to collect geolocation data that tells us your current location (based on your IP address). You can opt out of allowing us to collect this information either by refusing access to the information or by disabling your Location setting on your device. However, if you choose to opt out, you may not be able to use certain aspects of the Services.</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-2 mt-6">Information collected from other sources</h3>
              <p className="italic text-sm text-[#9f8b9d] mb-4">In Short: We may collect limited data from public databases, marketing partners, social media platforms, and other outside sources.</p>
              <p className="mb-4">
                In order to enhance our ability to provide relevant marketing, offers, and services to you and update our records, we may obtain information about you from other sources, such as public databases, joint marketing partners, affiliate programs, data providers, social media platforms, and from other third parties. This information includes mailing addresses, job titles, email addresses, phone numbers, intent data (or user behaviour data), Internet Protocol (IP) addresses, social media profiles, social media URLs, and custom profiles, for purposes of targeted advertising and event promotion.
              </p>
              <p className="mb-4">
                If you interact with us on a social media platform using your social media account (e.g. Facebook or X), we receive personal information about you from such platforms such as your name, email address, and gender. You may have the right to withdraw your consent to processing your personal information. Any personal information that we collect from your social media account depends on your social media account&apos;s privacy settings. Please note that their own use of your information is not governed by this Privacy Notice.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-12">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
              <p className="italic text-sm text-[#9f8b9d] mb-4">In Short: We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.</p>
              <p className="mb-4">We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</p>
              <ul className="list-disc pl-6 space-y-2 text-[#9f8b9d] mb-4">
                <li><strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong> We may process your information so you can create and log in to your account, as well as keep your account in working order.</li>
                <li><strong>To deliver and facilitate delivery of services to the user.</strong> We may process your information to provide you with the requested service.</li>
                <li><strong>To respond to user inquiries/offer support to users.</strong> We may process your information to respond to your inquiries and solve any potential issues you might have with the requested service.</li>
                <li><strong>To send administrative information to you.</strong> We may process your information to send you details about our products and services, changes to our terms and policies, and other similar information.</li>
                <li><strong>To request feedback.</strong> We may process your information when necessary to request feedback and to contact you about your use of our Services.</li>
                <li><strong>To protect our Services.</strong> We may process your information as part of our efforts to keep our Services safe and secure, including fraud monitoring and prevention.</li>
                <li><strong>To evaluate and improve our Services, products, marketing, and your experience.</strong> We may process your information when we believe it is necessary to identify usage trends, determine the effectiveness of our promotional campaigns, and to evaluate and improve our Services, products, marketing, and your experience.</li>
                <li><strong>To identify usage trends.</strong> We may process information about how you use our Services to better understand how they are being used so we can improve them.</li>
                <li><strong>To comply with our legal obligations.</strong> We may process your information to comply with our legal obligations, respond to legal requests, and exercise, establish, or defend our legal rights.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-12">3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
              <p className="italic text-sm text-[#9f8b9d] mb-4">In Short: We may share information in specific situations described in this section and/or with the following categories of third parties.</p>
              <p className="mb-4">
                <strong>Vendors, Consultants, and Other Third-Party Service Providers.</strong> We may share your data with third-party vendors, service providers, contractors, or agents (&apos;third parties&apos;) who perform services for us or on our behalf and require access to such information to do that work.
              </p>
              <p className="mb-4">The categories of third parties we may share personal information with are as follows:</p>
              <ul className="list-disc pl-6 space-y-1 text-[#9f8b9d] mb-4">
                <li>Cloud Computing Services</li>
                <li>Data Storage Service Providers</li>
                <li>User Account Registration & Authentication Services</li>
                <li>Website Hosting Service Providers</li>
              </ul>
              <p className="mb-4">We also may need to share your personal information in the following situations:</p>
              <ul className="list-disc pl-6 space-y-2 text-[#9f8b9d] mb-4">
                <li><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-12">4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>
              <p className="italic text-sm text-[#9f8b9d] mb-4">In Short: We may use cookies and other tracking technologies to collect and store your information.</p>
              <p className="mb-4">
                We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.
              </p>
              <p className="mb-4">
                We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements, to tailor advertisements to your interests, or to send abandoned shopping cart reminders (depending on your communication preferences). The third parties and service providers use their technology to provide advertising about products and services tailored to your interests which may appear either on our Services or on other websites.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-12">5. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</h2>
              <p className="italic text-sm text-[#9f8b9d] mb-4">In Short: If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.</p>
              <p className="mb-4">
                Our Services offer you the ability to register and log in using your third-party social media account details (like your Facebook or X logins). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile information we receive may vary depending on the social media provider concerned, but will often include your name, email address, friends list, and profile picture, as well as other information you choose to make public on such a social media platform.
              </p>
              <p className="mb-4">
                We will use the information we receive only for the purposes that are described in this Privacy Notice or that are otherwise made clear to you on the relevant Services. Please note that we do not control, and are not responsible for, other uses of your personal information by your third-party social media provider. We recommend that you review their privacy notice to understand how they collect, use, and share your personal information, and how you can set your privacy preferences on their sites and apps.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-12">6. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
              <p className="italic text-sm text-[#9f8b9d] mb-4">In Short: We keep your information for as long as necessary to fulfil the purposes outlined in this Privacy Notice unless otherwise required by law.</p>
              <p className="mb-4">
                We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.
              </p>
              <p className="mb-4">
                When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymise such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-12">7. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
              <p className="italic text-sm text-[#9f8b9d] mb-4">In Short: We aim to protect your personal information through a system of organisational and technical security measures.</p>
              <p className="mb-4">
                We have implemented appropriate and reasonable technical and organisational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorised third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-12">8. DO WE COLLECT INFORMATION FROM MINORS?</h2>
              <p className="italic text-sm text-[#9f8b9d] mb-4">In Short: We do not knowingly collect data from or market to children under 18 years of age.</p>
              <p className="mb-4">
                We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent&apos;s use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at <a href="mailto:support@tip-root.in" className="text-[#fbabff] hover:underline">support@tip-root.in</a>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-12">9. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
              <p className="italic text-sm text-[#9f8b9d] mb-4">In Short: You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.</p>
              <p className="mb-4">
                <strong>Withdrawing your consent:</strong> If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us.
              </p>
              <p className="mb-4">
                However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.
              </p>
              <p className="mb-4 font-bold">Account Information</p>
              <p className="mb-4">If you would at any time like to review or change the information in your account or terminate your account, you can:</p>
              <ul className="list-disc pl-6 space-y-2 text-[#9f8b9d] mb-4">
                <li>Log in to your account settings and update your user account.</li>
                <li>Contact us using the contact information provided.</li>
              </ul>
              <p className="mb-4">
                Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.
              </p>
              <p className="mb-4">
                <strong>Cookies and similar technologies:</strong> Most Web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our Services.
              </p>
              <p className="mb-4">
                If you have questions or comments about your privacy rights, you may email us at <a href="mailto:privacy@tip-root.in" className="text-[#fbabff] hover:underline">privacy@tip-root.in</a>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-12">10. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
              <p className="mb-4">
                Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track (&apos;DNT&apos;) feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognising and implementing DNT signals has been finalised. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-12">11. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
              <p className="italic text-sm text-[#9f8b9d] mb-4">In Short: Yes, we will update this notice as necessary to stay compliant with relevant laws.</p>
              <p className="mb-4">
                We may update this Privacy Notice from time to time. The updated version will be indicated by an updated &apos;Revised&apos; date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-12">12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
              <p className="mb-4">
                If you have questions or comments about this notice, you may email us at <a href="mailto:support@tip-root.in" className="text-[#fbabff] hover:underline">support@tip-root.in</a> or contact us by post at:
              </p>
              <address className="not-italic text-[#9f8b9d] pl-4 border-l-2 border-[#fbabff]/30 mb-4">
                Utkarsh Gopal Bhartariya<br />
                Hyderabad, Telangana<br />
                India
              </address>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4 mt-12">13. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
              <p className="mb-4">
                Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please visit: <a href="https://tip-root.in/contact" className="text-[#fbabff] hover:underline">https://tip-root.in/contact</a>.
              </p>
            </div>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-6 md:px-12 text-sm text-[#9f8b9d] border-t border-[#fbabff]/10 relative z-10 max-w-[1280px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mt-auto">
        <p>&copy; 2026 Tip Root. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
        </div>
      </footer>
    </div>
  );
}
