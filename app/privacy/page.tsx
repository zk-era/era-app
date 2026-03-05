"use client";

import { useEffect, useRef, useState } from "react";
import { PrivacyScrollBar } from "@/components/PrivacyScrollBar";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function PrivacyPage() {
  const lastUpdated = "February 26, 2026";
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionRefs.current.indexOf(
              entry.target as HTMLElement,
            );
            if (index !== -1) {
              setActiveSection(index);
            }
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: "-20% 0px -20% 0px",
      },
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      sectionRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <>
      <main className="flex w-full justify-center pt-40 pb-20">
        <motion.div 
          className="w-full max-w-3xl px-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            <h1 className="mb-2 text-4xl font-bold text-white">Privacy Notice</h1>
            <p className="mb-12 text-sm text-[#7b7b7b]">Last Updated {lastUpdated}</p>
          </motion.div>

          {/* Introduction */}
          <motion.div className="mb-12 space-y-4 text-[#a0a0a0]" variants={itemVariants}>
            <p>
              This Privacy Notice is designed to help you understand how ERA Protocol (&quot;<strong className="text-white">Company</strong>&quot;, 
              &quot;<strong className="text-white">we</strong>&quot;, &quot;<strong className="text-white">us</strong>&quot;, or 
              &quot;<strong className="text-white">our</strong>&quot;) collects, uses, and shares your personal information, and to help you 
              understand and exercise your privacy rights.
            </p>
          </motion.div>

          {/* Sections */}
          <motion.div className="space-y-12" variants={itemVariants}>
            {/* Section 1 */}
            <section
              id="scope"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[0] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">1. Scope and Updates to this Privacy Notice.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  This Privacy Notice applies when we process your personal information and is subject to change from time to time.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  This Privacy Notice applies to personal information processed by us, including through our website, the ERA Protocol 
                  web application, and any other online or offline offerings. We refer to these collectively as the &quot;<strong className="text-white">Services</strong>&quot;.
                </p>
                <p>
                  <strong className="text-white">Changes to our Privacy Notice.</strong> We may revise this Privacy Notice from time to 
                  time in our sole discretion. If there are any material changes to this Privacy Notice, we will notify you as required 
                  by applicable law. You understand and agree that you will be deemed to have accepted the updated Privacy Notice if you 
                  continue to use our Services after the new Privacy Notice takes effect.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section
              id="collection"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[1] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">2. Personal Information We Collect.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  This Privacy Notice applies to information you provide directly to us, information collected automatically from you, 
                  and information collected from other third-party sources.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  The categories of personal information we collect depend on how you interact with us, our Services, and the requirements 
                  of applicable law. We collect information that you provide to us, information we obtain automatically when you use our 
                  Services, and information from other sources such as third-party services and organizations, as described below.
                </p>

                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">Personal Information You Provide to Us Directly</h3>
                  <p className="mb-4">We may collect personal information that you provide to us.</p>

                  <ul className="list-disc space-y-3 pl-6">
                    <li>
                      <strong className="text-white">ERA Protocol Services.</strong> Our Services allow you to connect a self-custodial 
                      digital wallet that enables you to batch Ethereum transactions for reduced gas costs. We and our service providers 
                      may receive your wallet address when you connect your wallet to the Services or initiate a transaction batch.
                    </li>
                    <li>
                      <strong className="text-white">Non-Custodial Infrastructure.</strong> ERA Protocol is non-custodial. The system is 
                      designed so that we do not receive or retain your private keys, recovery phrases, or wallet passwords. Wallet access 
                      remains under your sole control and is not accessible to us or other parties through the Services.
                    </li>
                    <li>
                      <strong className="text-white">Your Communications with Us.</strong> We may collect personal information, such as email 
                      address, when you request information about the Company or our Services, request developer support, report issues, or 
                      otherwise communicate with us.
                    </li>
                  </ul>
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">Personal Information Collected Automatically</h3>
                  <p className="mb-4">We may collect personal information automatically when you use our Services.</p>

                  <ul className="list-disc space-y-3 pl-6">
                    <li>
                      <strong className="text-white">Automatic Collection of Personal Information.</strong> We may collect certain information 
                      automatically when you use our Services, such as your Internet protocol (IP) address, browser or device information, 
                      and approximate location information (including approximate location derived from IP address). We may also automatically 
                      collect information regarding your use of our Services, such as pages that you visit, the types of content you interact 
                      with, the frequency and duration of your activities, and other information about how you use our Services.
                    </li>
                    <li>
                      <strong className="text-white">Cookie Policy (and Other Technologies).</strong> We, as well as third parties that provide 
                      content or other functionality on our Services, may use cookies, pixel tags, local storage, and other technologies 
                      (&quot;<strong className="text-white">Technologies</strong>&quot;) to automatically collect information through your use of our Services.
                    </li>
                  </ul>

                  <div className="ml-6 mt-4 space-y-3">
                    <p>
                      <strong className="text-white">Cookies.</strong> Cookies are small text files placed in device browsers that store 
                      preferences and facilitate and enhance your experience.
                    </p>
                    <p>
                      <strong className="text-white">Pixel Tags/Web Beacons.</strong> A pixel tag (also known as a web beacon) is a piece 
                      of code embedded in our Services that collects information about engagement on our Services. The use of a pixel tag 
                      allows us to record, for example, that a user has visited a particular web page or clicked on a particular advertisement.
                    </p>
                  </div>

                  <p className="mt-4">Our uses of these Technologies fall into the following general categories:</p>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>
                      <strong className="text-white">Operationally Necessary.</strong> This includes Technologies that allow you access to 
                      our Services, applications, and tools that are required to identify irregular behavior, prevent fraudulent activity, 
                      improve security, or allow you to make use of our functionality;
                    </li>
                    <li>
                      <strong className="text-white">Performance-Related.</strong> We may use Technologies to assess the performance of our 
                      Services, including as part of our analytic practices to help us understand how individuals use our Services;
                    </li>
                    <li>
                      <strong className="text-white">Functionality-Related.</strong> We may use Technologies that allow us to offer you 
                      enhanced functionality when accessing or using our Services. This may include keeping track of your specified preferences 
                      or past items viewed;
                    </li>
                  </ul>

                  <p className="mt-4 text-sm">
                    See &quot;<strong className="text-white">Your Privacy Choices and Rights</strong>&quot; below to understand your choices 
                    regarding these Technologies.
                  </p>

                  <p className="mt-4">
                    <strong className="text-white">Analytics.</strong> We use Google Analytics and other third-party tools to process analytics 
                    information on our Services. These Technologies allow us to better understand how our Services are used, track adoption 
                    by developers, and to continually improve and personalize our Services. Google Analytics may collect information such as 
                    how often users visit our Services, what pages they visit, and what other sites they used prior to coming to our Services.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section
              id="usage"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[2] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">3. How We Use Your Personal Information.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  We may use your personal information to (1) provide the Services; (2) for administrative purposes such as improving the 
                  Services; (3) with your consent; and (4) for other permissible purposes as requested by you or as allowed under applicable law.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  We use your personal information for a variety of business purposes, including to provide our Services, for administrative 
                  purposes, and to improve our products and Services, as described below.
                </p>

                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">Provide Our Services</h3>
                  <p className="mb-2">We use your personal information to fulfill our contract with you and provide you with our Services, such as:</p>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>Processing and batching transactions on supported blockchain networks;</li>
                    <li>Providing access to certain areas, functionalities, and features of our Services;</li>
                    <li>Answering requests for developer or technical support;</li>
                    <li>Communicating with you about your activities on our Services and policy changes;</li>
                  </ul>
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">Administrative Purposes</h3>
                  <p className="mb-2">We use your personal information for various administrative purposes, such as:</p>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>Pursuing our legitimate interests such as research and development, network and information security, and fraud prevention;</li>
                    <li>Detecting security incidents, protecting against malicious, deceptive, fraudulent or illegal activity;</li>
                    <li>Measuring interest and engagement in our Services;</li>
                    <li>Improving, upgrading, or enhancing our Services;</li>
                    <li>Developing new products and services;</li>
                    <li>Ensuring internal quality control and safety;</li>
                    <li>Authenticating and verifying individual identities;</li>
                    <li>Debugging to identify and repair errors with our Services;</li>
                    <li>Auditing relating to interactions, transactions, and other compliance activities;</li>
                    <li>Sharing personal information with third parties as needed to provide the Services;</li>
                    <li>Enforcing our agreements and policies; and</li>
                    <li>Carrying out activities that are required to comply with our legal obligations.</li>
                  </ul>
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">With Your Consent</h3>
                  <p>
                    We may use personal information for other purposes that are clearly disclosed to you at the time you provide personal 
                    information or with your consent.
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">Other Purposes</h3>
                  <p className="mb-4">We also use your personal information for other purposes as requested by you or as permitted by applicable law.</p>
                  
                  <p className="mb-2">
                    <strong className="text-white">De-identified and Aggregated Information.</strong> We may use personal information to create 
                    de-identified and/or aggregated information, such as information about how developers use the Services, information about 
                    the device from which you access our Services, or other analyses we create. De-identified and/or aggregated information is 
                    not personal information, and we may use, disclose, and retain such information as permitted by applicable laws including, 
                    but not limited to, for research, analysis, analytics, and any other legally permissible purposes.
                  </p>

                  <p className="mt-4">
                    <strong className="text-white">Information Made Available on the Blockchain Network.</strong> Notwithstanding anything to 
                    the contrary in this Privacy Notice, information you make available on the blockchain network via ERA Protocol, such as your 
                    wallet address and transaction data, will be shared with third parties, made publicly visible and/or appear as part of the 
                    applicable blockchain network. In these situations, the personal information you share may not be able to be modified or 
                    deleted due to the immutable nature of blockchain technology. The foregoing disclosure may be made for purposes related to 
                    facilitating those activities or transactions on the blockchain.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section
              id="disclosure"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[3] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">4. How We Disclose Your Personal Information.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  We may share your personal information with third parties (1) to provide the Services; (2) to protect us or others; and 
                  (3) in connection with corporate transactions, such as a merger.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  We disclose your personal information to third parties for a variety of business purposes, including to provide our Services, 
                  to protect us or others, or in the event of a major business transaction such as a merger, sale, or asset transfer, as 
                  described below.
                </p>

                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">Disclosures to Provide our Services</h3>
                  <p className="mb-4">The categories of third parties with whom we may share your personal information are described below.</p>

                  <ul className="list-disc space-y-3 pl-6">
                    <li>
                      <strong className="text-white">Service Providers.</strong> We may share your personal information with our third-party 
                      service providers and vendors that assist us with the provision of our Services. This includes service providers and 
                      vendors that provide us with IT support, hosting, analytics (including Google Analytics), customer service, and related services.
                    </li>
                    <li>
                      <strong className="text-white">Business Partners.</strong> We may share your personal information with business partners 
                      to provide you with a product or service you have requested.
                    </li>
                    <li>
                      <strong className="text-white">Affiliates.</strong> We may share your personal information with our corporate affiliates.
                    </li>
                    <li>
                      <strong className="text-white">APIs/SDKs.</strong> We may use third-party application program interfaces (&quot;APIs&quot;) 
                      and software development kits (&quot;SDKs&quot;) as part of the functionality of our Services. For more information about 
                      our use of APIs and SDKs, please contact us as set forth in &quot;Contact Us&quot; below.
                    </li>
                  </ul>
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">Disclosures to Protect Us or Others</h3>
                  <p>
                    We may access, preserve, and disclose any information we store associated with you to external parties if we, in good faith, 
                    believe doing so is required or appropriate to: comply with law enforcement or national security requests and legal process, 
                    such as a court order or subpoena; protect your, our, or others&apos; rights, property, or safety; enforce our policies or 
                    contracts; collect amounts owed to us; or assist with an investigation or prosecution of suspected or actual illegal activity.
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">Disclosure in the Event of Merger, Sale, or Other Asset Transfers</h3>
                  <p>
                    If we are involved in a merger, acquisition, financing due diligence, reorganization, bankruptcy, receivership, purchase or 
                    sale of assets, or transition of service to another provider, your information may be sold or transferred as part of such a 
                    transaction, as permitted by law and/or contract.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section
              id="rights"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[4] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">5. Your Privacy Choices and Rights.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  You may be able to manage your preferences and communications from us and other option features offered via our Services. 
                  In addition, some privacy laws grant individuals certain rights regarding their personal information.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  <strong className="text-white">Your Privacy Choices.</strong> The privacy choices you may have about your personal information 
                  are determined by applicable law and are described below.
                </p>

                <ul className="list-disc space-y-3 pl-6">
                  <li>
                    <strong className="text-white">&quot;Do Not Track.&quot;</strong> Do Not Track (&quot;DNT&quot;) is a privacy preference 
                    that users can set in certain web browsers. Please note that we do not respond to or honor DNT signals or similar mechanisms 
                    transmitted by web browsers.
                  </li>
                  <li>
                    <strong className="text-white">Cookie Choices.</strong> You may stop or restrict the placement of Technologies on your 
                    device or remove them by adjusting your preferences as your browser or device permits. However, if you adjust your preferences, 
                    our Services may not work properly. Please note that cookie-based opt-outs are not effective on mobile applications. However, 
                    you may opt-out of personalized advertisements on some mobile applications by following the instructions for Android, iOS, 
                    and others. Please note you must separately opt out in each browser and on each device. You can also opt-out of Google 
                    Analytics by visiting <a href="https://tools.google.com/dlpage/gaoptout" className="text-[#22d3ee] hover:text-white" target="_blank" rel="noopener noreferrer">https://tools.google.com/dlpage/gaoptout</a>.
                  </li>
                </ul>

                <p className="mt-6">
                  <strong className="text-white">Your Privacy Rights.</strong> In accordance with applicable law, you may have the right to:
                </p>

                <ul className="list-disc space-y-3 pl-6">
                  <li>
                    <strong className="text-white">Access to and Portability of Your Personal Information</strong>, including: (i) confirming 
                    whether we are processing your personal information; (ii) obtaining access to or a copy of your personal information; and 
                    (iii) receiving an electronic copy of personal information that you have provided to us, or asking us to send that information 
                    to another company in a structured, commonly used, and machine readable format (also known as the &quot;right of data portability&quot;);
                  </li>
                  <li>
                    <strong className="text-white">Request Correction</strong> of your personal information where it is inaccurate or incomplete;
                  </li>
                  <li>
                    <strong className="text-white">Request Deletion</strong> of your personal information;
                  </li>
                  <li>
                    <strong className="text-white">Request Restriction</strong> of or Object to our processing of your personal information; and
                  </li>
                  <li>
                    <strong className="text-white">Withdraw your Consent</strong> to our processing of your personal information. Please note 
                    that your withdrawal will only take effect for future processing and will not affect the lawfulness of processing before the withdrawal.
                  </li>
                </ul>

                <p className="mt-4">
                  If you would like to exercise any of these rights, please contact us as set forth in &quot;Contact Us&quot; below. We will 
                  process such requests in accordance with applicable laws.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section
              id="international"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[5] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">6. International Transfers of Personal Information.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  We may transfer personal information internationally.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  All personal information processed by us may be transferred, processed, and stored anywhere in the world, including, but not 
                  limited to, the United Arab Emirates, the United States, or other countries, which may have data protection laws that are 
                  different from the laws where you live. We endeavor to safeguard your personal information consistent with the requirements 
                  of applicable laws.
                </p>
                <p>
                  If we transfer personal information which originates in the European Economic Area, Switzerland, and/or the United Kingdom 
                  to a country that has not been found to provide an adequate level of protection under applicable data protection laws, one of 
                  the safeguards we may use to support such transfer is the EU Standard Contractual Clauses.
                </p>
                <p>
                  For more information about the safeguards we use for international transfers of your personal information, please contact us 
                  as set forth below.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section
              id="children"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[6] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">7. Children&apos;s Information.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  Our Services are not directed at children.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  You must be 18 years or older to use the Services. The Services are not directed to children under 18 (or other age as 
                  required by local law), and we do not knowingly collect personal information from children.
                </p>
                <p>
                  If you are a parent or guardian and believe your child has uploaded personal information to our site without your consent, 
                  you may contact us as described in &quot;Contact Us&quot; below. If we become aware that a child has provided us with personal 
                  information in violation of applicable law, we will delete any personal information we have collected, unless we have a legal 
                  obligation to keep it, and terminate the child&apos;s account, if applicable.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section
              id="retention"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[7] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">8. Retention.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  We may retain your personal information for so long as necessary to fulfill the purposes for which it was collected.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  We take measures to delete your personal information or keep it in a form that does not permit identifying you when this 
                  personal information is no longer necessary for the purposes for which we process it, unless we are required by law to keep 
                  this personal information for a longer period. When determining the specific retention period, we take into account various 
                  criteria, such as the type of Service provided to you, the nature and length of our relationship with you, and mandatory 
                  retention periods provided by law and the statute of limitations.
                </p>
                <p>
                  <strong className="text-white">Blockchain Data.</strong> Please note that transaction data recorded on blockchain networks 
                  persists indefinitely due to the immutable nature of blockchain technology and cannot be deleted by the Company.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section
              id="nevada"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[8] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">9. Supplemental Notice for Nevada Residents.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  We do not &quot;sell&quot; your personal information as that term is used under Nevada law.
                </p>
              </div>
              <p className="text-[#a0a0a0]">
                If you are a resident of Nevada, you have the right to opt-out of the sale of certain personal information to third parties 
                who intend to license or sell that personal information. Please note that we do not currently sell your personal information 
                as sales are defined in Nevada Revised Statutes Chapter 603A. If you have any questions, please contact us as set forth in 
                &quot;Contact Us&quot; below.
              </p>
            </section>

            {/* Section 10 */}
            <section
              id="european"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[9] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">10. Supplemental Notice for European Users.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  If you are a resident in the European Economic Area or the United Kingdom, you are entitled to additional information and 
                  may have additional rights with respect to your personal information.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  This section applies to users located in the European Economic Area (&quot;<strong className="text-white">EEA</strong>&quot;) 
                  or the United Kingdom (&quot;<strong className="text-white">U.K.</strong>&quot;).
                </p>

                <p>
                  <strong className="text-white">Our Legal Bases for Processing Personal Information.</strong> If you are located in the EEA 
                  or the U.K., we only process your personal information when we have a valid &quot;legal basis.&quot; The legal bases we may 
                  rely on to process your information include:
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    <strong className="text-white">Consent.</strong> You have consented to the use of your personal information, for example 
                    to use cookies or analytics services.
                  </li>
                  <li>
                    <strong className="text-white">Contractual Necessity.</strong> We need your information to provide you with the Services, 
                    for example to process transaction batches.
                  </li>
                  <li>
                    <strong className="text-white">Compliance with a Legal Obligation.</strong> We have a legal obligation to use your personal 
                    information, for example to comply with tax and accounting obligations.
                  </li>
                  <li>
                    <strong className="text-white">Legitimate Interests.</strong> We or a third party have a legitimate interest in using your 
                    personal information. In particular, we have a legitimate interest in using your personal information for product development 
                    and internal analytics purposes, and otherwise to improve the safety, security, and performance of our Services. We only 
                    rely on our or a third party&apos;s legitimate interests to process your personal information when these interests are not 
                    overridden by your rights and interests.
                  </li>
                </ul>

                <p className="mt-6">
                  <strong className="text-white">Supervisory Authority.</strong> If your personal information is subject to the applicable data 
                  protection laws of the EEA, Switzerland, or the U.K., you have the right to lodge a complaint with the competent supervisory 
                  authority if you believe our processing of your personal information violates applicable law.
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    <a href="https://edpb.europa.eu/about-edpb/board/members_en" className="text-[#22d3ee] hover:text-white" target="_blank" rel="noopener noreferrer">
                      EEA Data Protection Authorities (DPAs)
                    </a>
                  </li>
                  <li>
                    <a href="https://www.edoeb.admin.ch/edoeb/en/home/the-fdpic/contact.html" className="text-[#22d3ee] hover:text-white" target="_blank" rel="noopener noreferrer">
                      Swiss Federal Data Protection and Information Commissioner (FDPIC)
                    </a>
                  </li>
                  <li>
                    <a href="https://ico.org.uk/global/contact-us/" className="text-[#22d3ee] hover:text-white" target="_blank" rel="noopener noreferrer">
                      UK Information Commissioner&apos;s Office (ICO)
                    </a>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 11 */}
            <section
              id="other"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[10] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">11. Other Provisions.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  We are not responsible for third-party links and services.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  <strong className="text-white">Third-Party Websites/Applications.</strong> The Services may contain links to other 
                  websites/applications and other websites/applications may reference or link to our Services. These third-party services, 
                  including wallet providers, RPC providers, and blockchain explorers, are not controlled by us. We encourage our users to 
                  read the privacy policies of each website and application with which they interact. We do not endorse, screen, or approve, 
                  and are not responsible for, the privacy practices or content of such other websites or applications. Providing personal 
                  information to third-party websites or applications is at your own risk.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section
              id="contact"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[11] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">12. Contact Us.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  If you have any questions, you may contact us.
                </p>
              </div>
              <p className="text-[#a0a0a0]">
                If you have any questions about our privacy practices or this Privacy Notice, or to exercise your rights as detailed in this 
                Privacy Notice, please contact us at{" "}
                <a href="mailto:legal@zkera.xyz" className="text-[#22d3ee] transition-colors hover:text-white">
                  legal@zkera.xyz
                </a>
              </p>
            </section>
          </motion.div>
        </motion.div>
      </main>

      {/* Animated Scroll Progress Bar */}
      <PrivacyScrollBar activeSection={activeSection} setActiveSection={setActiveSection} />
    </>
  );
}
