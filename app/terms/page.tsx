"use client";

import { useEffect, useRef, useState } from "react";
import { TermsScrollBar } from "@/components/TermsScrollBar";
import Link from "next/link";
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

export default function TermsPage() {
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
            <h1 className="mb-2 text-4xl font-bold text-white">Terms of Service</h1>
            <p className="mb-12 text-sm text-[#7b7b7b]">Last Updated {lastUpdated}</p>
          </motion.div>

          {/* Introduction */}
          <motion.div className="mb-12 space-y-4 text-[#a0a0a0]" variants={itemVariants}>
            <p>
              ERA Protocol (&quot;<strong className="text-white">Company</strong>&quot;, &quot;<strong className="text-white">we</strong>&quot;, 
              &quot;<strong className="text-white">us</strong>&quot;, or &quot;<strong className="text-white">our</strong>&quot;) provides experimental 
              blockchain infrastructure software that batches multiple Ethereum transactions to reduce gas costs through zero-knowledge proof coordination. 
              The protocol is currently deployed on Sepolia testnet and accessible through our web application interface (together, the &quot;<strong className="text-white">Services</strong>&quot;).
            </p>
            <p>
              Please read these Terms of Service (the &quot;<strong className="text-white">Terms</strong>&quot;) and our{" "}
              <Link href="/privacy" className="text-[#22d3ee] hover:text-white">Privacy Policy</Link>
              {" "}(&quot;<strong className="text-white">Privacy Policy</strong>&quot;) carefully because they govern your use of our Services.
            </p>

            {/* Important Notices */}
            <motion.div className="my-6 space-y-6" variants={itemVariants}>
              <div>
                <p className="mb-2 font-bold uppercase text-white">
                  NOTICE ON EXPERIMENTAL SOFTWARE – TESTNET ONLY:
                </p>
                <p className="text-sm leading-relaxed text-[#a0a0a0]">
                  ERA PROTOCOL IS EXPERIMENTAL SOFTWARE DEPLOYED ON SEPOLIA TESTNET FOR PROOF-OF-CONCEPT PURPOSES ONLY. 
                  THE SERVICES ARE PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. DO NOT SEND REAL FUNDS OR MAINNET ASSETS 
                  TO ERA PROTOCOL CONTRACTS. USE BURNER WALLETS AND TEST TOKENS ONLY. SMART CONTRACTS HAVE NOT BEEN FORMALLY AUDITED. 
                  BY USING THE SERVICES, YOU ACKNOWLEDGE AND ACCEPT ALL RISKS ASSOCIATED WITH BLOCKCHAIN TECHNOLOGY, SMART CONTRACTS, 
                  ZERO-KNOWLEDGE PROOFS, AND EXPERIMENTAL SOFTWARE.
                </p>
              </div>

              <div>
                <p className="mb-2 font-bold uppercase text-white">
                  NOTICE ON COMPLIANCE – RESTRICTED PERSONS:
                </p>
                <p className="text-sm leading-relaxed text-[#a0a0a0]">
                  THE SERVICES ARE NOT OFFERED TO AND MAY NOT BE USED BY PERSONS OR ENTITIES WHO: (A) RESIDE IN, ARE CITIZENS OF, ARE LOCATED IN, 
                  ARE INCORPORATED IN, OR HAVE A REGISTERED OFFICE IN ANY STATE, COUNTRY OR OTHER JURISDICTION THAT IS SUBJECT TO ECONOMIC SANCTIONS 
                  OR EMBARGOES; OR (B) ARE LISTED ON ANY GOVERNMENT RESTRICTED PARTIES LIST. BY USING THE SERVICES, YOU REPRESENT AND WARRANT THAT 
                  YOU ARE NOT A RESTRICTED PERSON AND DO NOT RESIDE IN A RESTRICTED JURISDICTION. YOU MUST NOT USE ANY TECHNOLOGY (E.G., VPN) TO 
                  CIRCUMVENT THESE RESTRICTIONS.
                </p>
              </div>

              <div>
                <p className="mb-2 font-bold uppercase text-white">
                  IMPORTANT NOTICE REGARDING DISPUTE RESOLUTION:
                </p>
                <p className="text-sm leading-relaxed text-[#a0a0a0]">
                  WHEN YOU AGREE TO THESE TERMS YOU ARE AGREEING (WITH LIMITED EXCEPTION) TO RESOLVE ANY DISPUTE BETWEEN YOU AND THE COMPANY 
                  THROUGH GOOD FAITH NEGOTIATIONS AND, IF NECESSARY, BINDING ARBITRATION RATHER THAN IN COURT. PLEASE REVIEW CAREFULLY SECTION 18 
                  &quot;DISPUTE RESOLUTION&quot; BELOW FOR DETAILS. HOWEVER, IF YOU ARE A RESIDENT OF A JURISDICTION WHERE APPLICABLE LAW PROHIBITS 
                  ARBITRATION OF DISPUTES, THE AGREEMENT TO ARBITRATE IN SECTION 18 WILL NOT APPLY TO YOU BUT THE PROVISIONS OF SECTION 17 
                  (GOVERNING LAW AND JURISDICTION) WILL STILL APPLY.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Sections */}
          <motion.div className="space-y-12" variants={itemVariants}>
            {/* Section 1 */}
            <section
              id="agreement"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[0] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">1. Agreement to Terms.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  To use the Services, you must agree to these Terms.
                </p>
              </div>
              <p className="text-[#a0a0a0]">
                By using our Services, you agree to be bound by these Terms. If you do not agree to be bound by these Terms, 
                do not use the Services.
              </p>
            </section>

            {/* Section 2 */}
            <section
              id="privacy"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[1] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">2. Privacy Policy.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  Your use of the Services is also subject to our Privacy Policy; please review it.
                </p>
              </div>
              <p className="text-[#a0a0a0]">
                Please review our{" "}
                <Link href="/privacy" className="text-[#22d3ee] hover:text-white">Privacy Policy</Link>, which also governs your use of the Services, for information on how we collect, 
                use and share your information.
              </p>
            </section>

            {/* Section 3 */}
            <section
              id="changes"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[2] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">3. Changes to these Terms or the Services.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  The Services and these Terms are subject to change from time to time.
                </p>
              </div>
              <p className="text-[#a0a0a0]">
                We may update the Terms from time to time in our sole discretion. If we do, we will let you know by posting the 
                updated Terms and updating the &quot;Last Updated&quot; date. It is important that you review the Terms whenever we 
                update them or you use the Services. If you continue to use the Services after we have posted updated Terms it means 
                that you accept and agree to the changes. If you do not agree to be bound by the changes, you may not use the Services 
                anymore. Because our Services are evolving over time we may change or discontinue all or any part of the Services, 
                at any time and without notice, at our sole discretion.
              </p>
            </section>

            {/* Section 4 */}
            <section
              id="eligibility"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[3] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">4. Who May Use the Services.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  There are some restrictions on who can use the Services.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  You may use the Services only if you are 18 years or older and capable of forming a binding contract with the Company, 
                  and not otherwise barred from using the Services under these Terms or applicable law.
                </p>
                <p>
                  You certify that you will comply with all applicable laws when using the Services. Without limiting the foregoing, by using 
                  the Services, you represent and warrant that you are not a Restricted Person and do not reside in a Restricted Jurisdiction. 
                  If you access or use the Services outside the United Arab Emirates, you are solely responsible for ensuring that your access 
                  and use of the Services in such country, territory or jurisdiction does not violate any applicable law. You must not use any 
                  software or networking techniques, including use of a Virtual Private Network (VPN) to modify your internet protocol address 
                  or otherwise circumvent or attempt to circumvent these restrictions.
                </p>
                <p>
                  We reserve the right, but have no obligation, to monitor access to the Services. Furthermore, we reserve the right, at any 
                  time, in our sole discretion, to block access to the Services, in whole or in part, from any geographic location, IP address, 
                  or unique device identifier, or to any user who we believe is in breach of these Terms.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section
              id="use"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[4] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">5. Use of the Services.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  You must connect a wallet to use the Services. You are responsible for all activities associated with your wallet address.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  <strong className="text-white">Wallet Connection.</strong> To use the Services, you must connect a self-custodial 
                  wallet (such as MetaMask, Rainbow, or other compatible wallets) to our application. When you connect your wallet, 
                  you authorize ERA Protocol to read your public wallet address and request your signature for transaction batching operations.
                </p>
                <p>
                  <strong className="text-white">Non-Custodial.</strong> ERA Protocol is non-custodial infrastructure. The Company does 
                  not store, have access to, or control your private keys, wallet credentials, or digital assets. You are solely responsible 
                  for safeguarding your wallet credentials and for all activity conducted through your wallet address, whether or not you 
                  authorized such activity.
                </p>
                <p>
                  <strong className="text-white">No Recovery.</strong> The Company cannot recover or regenerate your wallet credentials 
                  on your behalf. TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE COMPANY DISCLAIMS ALL LIABILITY IN CONNECTION WITH YOUR WALLET, 
                  CREDENTIALS, DIGITAL ASSETS, OR ANY TRANSACTIONS CONDUCTED THROUGH THE SERVICES, AND YOU AGREE TO HOLD THE COMPANY HARMLESS 
                  FROM ANY RESULTING CLAIMS OR LOSSES.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section
              id="risk"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[5] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">6. Assumption of Risk.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  You assume the risks of engaging in novel and experimental technology.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  Technologies such as smart contracts on blockchain networks, zero-knowledge proofs, cryptographic signatures, and other 
                  nascent software and systems are experimental, speculative, inherently risky, and subject to change. Among other risks, 
                  bugs, malfunctions, cyberattacks, or changes to the applicable blockchain (e.g., forks) could disrupt these technologies 
                  and even result in a total loss of digital assets or their market value. We assume no liability or responsibility for any 
                  such risks. If you are not comfortable assuming these risks, you should not use the Services.
                </p>
                <p>
                  You acknowledge and agree that all transactions using the Services will be automatically processed using smart contracts. 
                  By engaging in transactions using the Services, you acknowledge and consent to the automatic processing of all transactions. 
                  The applicable smart contract will dictate how funds and digital assets are distributed.
                </p>
                <p>
                  <strong className="text-white">Testnet Environment.</strong> ERA Protocol is currently deployed ONLY on Sepolia testnet. 
                  This is an experimental proof-of-concept. Always verify you are connected to Sepolia testnet before transacting. Use burner 
                  wallets and test tokens only. Smart contracts have not been formally audited by third-party security firms.
                </p>
                <p>
                  You bear sole responsibility for evaluating the Services before using them, and all transactions on the blockchain are 
                  irreversible, final, and without refunds. The Services may be disabled, disrupted, or adversely impacted as a result of 
                  sophisticated cyber-attacks, surges in activity, computer viruses, and/or other operational or technical challenges. We 
                  disclaim any ongoing obligation to notify you of all the potential risks of using and accessing our Services. You agree to 
                  accept these risks and agree that you will not seek to hold the Company responsible for any consequent losses.
                </p>
                <p>
                  The Services may be inaccessible or inoperable for any reason, including equipment malfunctions, periodic maintenance procedures 
                  or repairs, causes beyond our control or that we could not reasonably foresee, disruptions and temporary or permanent unavailability 
                  of underlying blockchain infrastructure, or unavailability of third-party service providers or external partners. You acknowledge 
                  and agree that you will access and use the Services at your own risk. You should not engage in blockchain-based transactions unless 
                  it is suitable given your circumstances and financial resources.
                </p>
              </div>
            </section>

            {/* Section 7 - NEW: Feedback */}
            <section
              id="feedback"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[6] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">7. Feedback.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  If you provide us feedback about the Services, we are free to use it.
                </p>
              </div>
              <p className="text-[#a0a0a0]">
                We appreciate feedback, comments, ideas, proposals and suggestions for improvements to the Services 
                (&quot;<strong className="text-white">Feedback</strong>&quot;). If you choose to submit Feedback, you agree that we are free 
                to use it without any restriction or compensation to you.
              </p>
            </section>

            {/* Section 8 - was 7 */}
            <section
              id="fees"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[7] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">8. Fees.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  We currently do not charge fees for the Services, but blockchain transactions incur gas fees.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  We may charge fees for Services we make available to you in the future, and we reserve the right to change those fees 
                  at our discretion upon notice to you. We will disclose the amount of fees we will charge you for the applicable Service 
                  at the time that you access the Service.
                </p>
                <p>
                  We may provide Services free of charge however, all transactions using blockchains require the payment of network and/or 
                  transaction fees (also known as &quot;gas fees&quot;) paid on every transaction that occurs on the selected blockchain network. 
                  You are solely responsible for any gas fees.
                </p>
                <p>
                  You may incur fees for use of third-party software and services in connection with your use of the Services. Third-party 
                  fees are not charged by the Company and are not paid to the Company.
                </p>
              </div>
            </section>

            {/* Section 9 - was 8 */}
            <section
              id="third-party"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[8] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">9. Third-Party Resources and Services.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  The Services may integrate with third-party services; we are not responsible for such services.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  The Services may allow you to access third-party websites, applications, content, or services, including wallet providers 
                  (RainbowKit, WalletConnect), RPC providers (Infura, Alchemy), and block explorers (Etherscan). Your use of any third-party 
                  services is entirely at your own discretion and risk, and may be subject to additional terms, conditions, and privacy policies 
                  established by the relevant third-party provider.
                </p>
                <p>
                  The Company does not control, endorse, or assume responsibility for any third-party services, including their content, 
                  accuracy, functionality, availability, legality, or performance. The Company does not guarantee that any third-party services 
                  will remain available or continue to function as intended. You acknowledge and agree that: (i) access to third-party services 
                  is provided &quot;as is&quot; and &quot;as available&quot;; (ii) your interactions with any third-party provider are solely 
                  between you and that provider; and (iii) the Company is not liable for any loss or damage incurred in connection with your 
                  use of, or reliance on, any third-party services.
                </p>
              </div>
            </section>

            {/* Section 10 - was 9 */}
            <section
              id="prohibitions"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[9] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">10. General Prohibitions and Enforcement Rights.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  You cannot tamper with the Services, break the law, or interfere with other users.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>You agree not to do any of the following:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Use, display, mirror or frame the Services or any individual element within the Services, the Company name, any Company 
                  trademark, logo or other proprietary information, without the Company&apos;s express written consent;</li>
                  <li>Access, tamper with, or use non-public areas of the Services, the Company computer systems, or the technical delivery 
                  systems of the Company providers;</li>
                  <li>Attempt to probe, scan or test the vulnerability of any Company system or network or breach any security or authentication measures;</li>
                  <li>Avoid, bypass, remove, deactivate, impair, descramble or otherwise circumvent any technological measure implemented by the 
                  Company or any other third party to protect the Services;</li>
                  <li>Attempt to access or search the Services using any engine, software, tool, agent, device or mechanism other than the software 
                  and/or search agents provided by the Company or other generally available third-party web browsers;</li>
                  <li>Use the Services for any illegal or unauthorized purpose, or engage in, encourage, or promote any illegal activity;</li>
                  <li>Attempt to decipher, decompile, disassemble, or reverse engineer any of the software used to provide the Services;</li>
                  <li>Interfere with, or attempt to interfere with, the access of any user, host or network, including sending a virus, overloading, 
                  flooding, spamming, or mail-bombing the Services;</li>
                  <li>Collect or store any personally identifiable information from other users without their express permission;</li>
                  <li>Impersonate or misrepresent your affiliation with any person or entity;</li>
                  <li>Violate any applicable law or regulation; or</li>
                  <li>Encourage or enable any other individual to do any of the foregoing.</li>
                </ul>
                <p className="mt-4">
                  The Company is not obligated to monitor access to or use of the Services. However, we have the right to do so for the purpose 
                  of operating the Services, to ensure compliance with these Terms and to comply with applicable law or other legal requirements. 
                  We reserve the right, but are not obligated, to remove or disable access to any Services or content, at any time and without notice. 
                  We have the right to investigate violations of these Terms or conduct that affects the Services. We may also consult and cooperate 
                  with law enforcement authorities to prosecute users who violate the law.
                </p>
              </div>
            </section>

            {/* Section 11 - was 10 */}
            <section
              id="termination"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[10] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">11. Suspension and Termination.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  We may suspend or terminate your use of the Services at any time.
                </p>
              </div>
              <p className="text-[#a0a0a0]">
                We may suspend or terminate your access to and use of the Services, at our sole discretion, at any time and without notice 
                to you, including as required by applicable law or any governmental authority, or if we determine that you are violating these 
                Terms. Such suspension or termination shall not constitute a breach of these Terms by the Company. In accordance with our 
                compliance policies and practices, we may impose reasonable limitations and controls on your ability to use the Services. Upon 
                any termination, discontinuation or cancellation of the Services, the following Sections will survive: 6, 7, 8(a) (only for 
                payments due and owing to the Company prior to the termination), 10, 11, 12, 13, 14, 15, 16, 17, 18 and 19.
              </p>
            </section>

            {/* Section 12 - was 11 */}
            <section
              id="warranties"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[11] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">12. Warranty Disclaimers.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  We don&apos;t make any guarantees about the Services.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  THE SERVICES ARE PROVIDED &quot;AS IS,&quot; WITHOUT WARRANTY OF ANY KIND. WITHOUT LIMITING THE FOREGOING, WE EXPLICITLY 
                  DISCLAIM ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT AND NON-INFRINGEMENT, 
                  AND ANY WARRANTIES ARISING OUT OF COURSE OF DEALING OR USAGE OF TRADE. We make no warranty that the Services will meet 
                  your requirements or be available on an uninterrupted, secure, or error-free basis. We make no warranty regarding the 
                  quality, accuracy, timeliness, truthfulness, completeness or reliability of any information or content on the Services.
                </p>
                <p>
                  THE COMPANY HEREBY DISCLAIMS ANY AND ALL LIABILITY AND RESPONSIBILITY FOR OR IN CONNECTION WITH (I) YOUR HANDLING, MISHANDLING, 
                  DISCLOSURE, USE, OR MISUSE, OF ANY CREDENTIALS, AND (II) ANY THIRD-PARTY SERVICES. NOTHING HEREIN NOR ANY USE OF THE SERVICES 
                  IN CONNECTION WITH THIRD PARTY SERVICES CONSTITUTES OUR ENDORSEMENT, RECOMMENDATION OR ANY OTHER AFFILIATION OF OR WITH ANY 
                  THIRD-PARTY SERVICES.
                </p>
                <p>
                  ERA PROTOCOL IS NON-CUSTODIAL INFRASTRUCTURE. THE COMPANY DOES NOT HAVE THE ABILITY TO EFFECTUATE OR BLOCK ANY TRANSACTION. 
                  THE COMPANY DOES NOT HAVE ACCESS TO YOUR WALLET CREDENTIALS, YOUR FUNDS, OR ANY DIGITAL ASSETS, WHICH ARE YOUR SOLE RESPONSIBILITY.
                </p>
                <p>
                  THE COMPANY TAKES NO RESPONSIBILITY FOR, AND WILL NOT BE LIABLE TO YOU FOR ANY LOSSES, DAMAGES OR CLAIMS ARISING FROM: 
                  (I) USER ERROR SUCH AS FORGOTTEN CREDENTIALS, INCORRECTLY CONSTRUCTED TRANSACTIONS, OR MISTYPED WALLET ADDRESSES; 
                  (II) SERVER FAILURE OR DATA LOSS; (III) BLOCKCHAIN NETWORKS, FORKS, OR TECHNICAL NODE ISSUES; (IV) UNAUTHORIZED ACCESS 
                  TO SERVICES; OR (V) ANY THIRD PARTY ACTIVITIES, INCLUDING WITHOUT LIMITATION THE USE OF VIRUSES, PHISHING, BRUTEFORCING OR 
                  OTHER MEANS OF ATTACK. THE COMPANY IS NOT RESPONSIBLE FOR ANY ISSUES WITH BLOCKCHAINS, INCLUDING FORKS, TECHNICAL NODE ISSUES 
                  OR ANY OTHER ISSUES HAVING FUND LOSSES AS A RESULT.
                </p>
                <p className="text-sm">
                  SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES. ACCORDINGLY, SOME OF THE ABOVE DISCLAIMERS OF WARRANTIES 
                  MAY NOT APPLY TO YOU.
                </p>
              </div>
            </section>

            {/* Section 13 - was 12 */}
            <section
              id="indemnity"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[12] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">13. Indemnity.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  If someone sues us based on your breach of these Terms or your use of the Services, you agree to indemnify us.
                </p>
              </div>
              <p className="text-[#a0a0a0]">
                You will indemnify and hold the Company and its officers, directors, employees and agents, harmless from and against any 
                claims, disputes, demands, liabilities, damages, losses, and costs and expenses, including, without limitation, reasonable 
                legal and defense fees arising out of or in any way connected with (a) your access to or use of the Services, (b) any use 
                of your wallet or credentials, (c) your access to or use of third-party services, or (d) your violation of these Terms. You 
                may not settle or otherwise compromise any claim subject to this Section without the Company&apos;s prior written approval.
              </p>
            </section>

            {/* Section 14 - was 13 */}
            <section
              id="liability"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[13] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">14. Limitation of Liability.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  This Section limits what you can recover from us in a dispute.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER THE COMPANY NOR ITS SERVICE PROVIDERS INVOLVED IN CREATING, PRODUCING, OR 
                  DELIVERING THE SERVICES WILL BE LIABLE FOR ANY INCIDENTAL, SPECIAL, EXEMPLARY OR CONSEQUENTIAL DAMAGES, OR DAMAGES FOR LOST 
                  PROFITS, LOST REVENUES, LOST SAVINGS, LOST BUSINESS OPPORTUNITY, LOSS OF DATA OR GOODWILL, SERVICE INTERRUPTION, COMPUTER 
                  DAMAGE OR SYSTEM FAILURE OR THE COST OF SUBSTITUTE SERVICES OF ANY KIND ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR 
                  FROM THE USE OF OR INABILITY TO USE THE SERVICES, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), PRODUCT 
                  LIABILITY OR ANY OTHER LEGAL THEORY, AND WHETHER OR NOT THE COMPANY OR ITS SERVICE PROVIDERS HAVE BEEN INFORMED OF THE 
                  POSSIBILITY OF SUCH DAMAGE, EVEN IF A LIMITED REMEDY SET FORTH HEREIN IS FOUND TO HAVE FAILED OF ITS ESSENTIAL PURPOSE.
                </p>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL THE COMPANY&apos;S TOTAL LIABILITY ARISING OUT OF OR IN CONNECTION 
                  WITH THESE TERMS OR FROM THE USE OF OR INABILITY TO USE THE SERVICES EXCEED THE AMOUNTS YOU HAVE PAID OR ARE PAYABLE BY YOU 
                  TO THE COMPANY FOR USE OF THE SERVICES OR ONE HUNDRED DOLLARS ($100 USD), IF YOU HAVE NOT HAD ANY PAYMENT OBLIGATIONS TO THE 
                  COMPANY, AS APPLICABLE.
                </p>
                <p className="text-sm">
                  THE EXCLUSIONS AND LIMITATIONS OF DAMAGES SET FORTH ABOVE ARE FUNDAMENTAL ELEMENTS OF THE BASIS OF THE BARGAIN BETWEEN 
                  THE COMPANY AND YOU.
                </p>
              </div>
            </section>

            {/* Section 15 - was 14 - updated name to match Family.co */}
            <section
              id="governing-law"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[14] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">15. Governing Law and Forum Choice.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  These Terms are governed by the laws of the United Arab Emirates and Dubai courts have jurisdiction.
                </p>
              </div>
              <p className="text-[#a0a0a0]">
                These Terms and any action related thereto will be governed by the laws of the United Arab Emirates and the Emirate of Dubai, 
                without regard to its conflict of laws provisions. Except as otherwise expressly set forth in Section 18 &quot;Dispute Resolution,&quot; 
                the exclusive jurisdiction for all disputes (defined below) that you and the Company are not required to arbitrate will be the 
                courts of Dubai, UAE, and you and the Company each waive any objection to jurisdiction and venue in such courts.
              </p>
            </section>

            {/* Section 16 - was 15 */}
            <section
              id="general"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[15] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">16. General Terms.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  We own all rights to the Services. This section includes other general legal terms.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p>
                  <strong className="text-white">Reservation of Rights.</strong> The Company and its licensors exclusively own all right, title 
                  and interest in and to the Services, including all associated intellectual property rights. You acknowledge that the Services 
                  are protected by copyright, trademark, and other laws. You agree not to remove, alter or obscure any copyright, trademark, 
                  service mark or other proprietary rights notices incorporated in or accompanying the Services.
                </p>
                <p>
                  <strong className="text-white">Entire Agreement.</strong> These Terms constitute the entire and exclusive understanding 
                  and agreement between the Company and you regarding the Services, and these Terms supersede and replace all prior oral 
                  or written understandings or agreements between the Company and you regarding the Services. If any provision of these Terms 
                  is held invalid or unenforceable by an arbitrator or a court of competent jurisdiction, that provision will be enforced to 
                  the maximum extent permissible and the other provisions of these Terms will remain in full force and effect.
                </p>
                <p>
                  <strong className="text-white">Assignment.</strong> Except where provided by applicable law in your jurisdiction, you may not 
                  assign or transfer these Terms, by operation of law or otherwise, without the Company&apos;s prior written consent. Any attempt 
                  by you to assign or transfer these Terms absent our consent or your statutory right, without such consent, will be null. The 
                  Company may freely assign or transfer these Terms without restriction. Subject to the foregoing, these Terms will bind and 
                  inure to the benefit of the parties, their successors and permitted assigns.
                </p>
                <p>
                  <strong className="text-white">Notices.</strong> Any notices or other communications provided by the Company under these Terms 
                  will be given by posting to the Services.
                </p>
                <p>
                  <strong className="text-white">Waiver of Rights.</strong> The Company&apos;s failure to enforce any right or provision of these 
                  Terms will not be considered a waiver of such right or provision. The waiver of any such right or provision will be effective 
                  only if in writing and signed by a duly authorized representative of the Company. Except as expressly set forth in these Terms, 
                  the exercise by either party of any of its remedies under these Terms will be without prejudice to its other remedies under 
                  these Terms or otherwise.
                </p>
              </div>
            </section>

            {/* Section 17 - NEW: Dispute Resolution */}
            <section
              id="dispute-resolution"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[16] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">17. Severability.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  If any provision of these Terms is invalid, the rest remain in effect.
                </p>
              </div>
              <p className="text-[#a0a0a0]">
                If any provision of these Terms is held invalid or unenforceable by a court of competent jurisdiction, that provision will be 
                enforced to the maximum extent permissible and the other provisions of these Terms will remain in full force and effect.
              </p>
            </section>

            {/* Section 18 - NEW: Dispute Resolution */}
            <section
              id="arbitration"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[17] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">18. Dispute Resolution.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  If there is a dispute between us, we&apos;ll attempt to resolve it through good faith negotiations and, if necessary, arbitration.
                </p>
              </div>
              <div className="space-y-4 text-[#a0a0a0]">
                <p className="font-bold uppercase text-white">
                  PLEASE READ THIS SECTION CAREFULLY: IT MAY SIGNIFICANTLY AFFECT YOUR LEGAL RIGHTS.
                </p>

                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">Agreement to Attempt to Resolve Disputes Through Good Faith Negotiations</h3>
                  <p>
                    Prior to commencing any legal proceeding against us of any kind, you and we agree that we will attempt to resolve any dispute, 
                    claim, or controversy between us arising out of or relating to these Terms or the Services (each, a &quot;<strong className="text-white">Dispute</strong>&quot; 
                    and, collectively, &quot;<strong className="text-white">Disputes</strong>&quot;) by engaging in good faith negotiations. Such 
                    good faith negotiations require, at a minimum, that the aggrieved party provide a written notice to the other party specifying 
                    the nature and details of the Dispute. The party receiving such notice shall have thirty (30) days to respond to the notice. 
                    Within sixty (60) days after the aggrieved party sent the initial notice, the parties shall meet and confer in good faith by 
                    videoconference, or by telephone, to try to resolve the Dispute. If the parties are unable to resolve the Dispute within ninety 
                    (90) days after the aggrieved party sent the initial notice, the parties may agree to mediate their Dispute, or either party 
                    may submit the Dispute to arbitration as set forth below.
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">Agreement to Arbitrate</h3>
                  <p className="mb-4">
                    You and we agree that any Dispute that cannot be resolved through the procedures set forth above will be resolved through 
                    binding arbitration in accordance with the applicable arbitration rules. The place of arbitration shall be Dubai, United Arab 
                    Emirates. The language of the arbitration shall be English. The arbitrator(s) shall have experience adjudicating matters involving 
                    Internet technology, software applications, financial transactions and, ideally, blockchain technology. The prevailing party will 
                    be entitled to an award of their reasonable attorney&apos;s fees and costs. Except as may be required by law, neither a party nor 
                    its representatives may disclose the existence, content, or results of any arbitration hereunder without the prior written consent 
                    of both parties.
                  </p>
                  <p className="font-bold text-white">
                    UNLESS YOU PROVIDE US WITH A TIMELY ARBITRATION OPT-OUT NOTICE AT THE EMAIL INDICATED IN THE CONTACT INFORMATION BELOW, YOU 
                    ACKNOWLEDGE AND AGREE THAT YOU AND WE ARE EACH WAIVING THE RIGHT TO A TRIAL BY JURY. FURTHER, UNLESS BOTH YOU AND WE OTHERWISE 
                    AGREE IN WRITING, THE ARBITRATOR MAY NOT CONSOLIDATE MORE THAN ONE PERSON&apos;S CLAIMS AND MAY NOT OTHERWISE PRESIDE OVER ANY 
                    FORM OF REPRESENTATIVE OR CLASS PROCEEDING.
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold text-white">Exception for Residents in Jurisdictions Prohibiting Arbitration</h3>
                  <p>
                    If you are a resident of a jurisdiction where applicable law prohibits arbitration of disputes, the agreement to arbitrate in 
                    this Section will not apply to you but the provisions of Section 15 (Governing Law and Forum Choice) will still apply.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 19 - was 16 */}
            <section
              id="contact"
              className="scroll-mt-20"
              ref={(el) => {
                sectionRefs.current[18] = el;
              }}
            >
              <h2 className="mb-3 text-2xl font-semibold text-white">19. Contact Information.</h2>
              <div className="mb-4 rounded-lg bg-[#22d3ee]/10 px-3 py-2">
                <p className="text-sm text-[#22d3ee]">
                  If you have any questions, you may contact us.
                </p>
              </div>
              <p className="text-[#a0a0a0]">
                If you have any questions about these Terms of Service, or to understand your obligations under these Terms, 
                please contact us at{" "}
                <a href="mailto:legal@zkera.xyz" className="text-[#22d3ee] transition-colors hover:text-white">
                  legal@zkera.xyz
                </a>
              </p>
            </section>
          </motion.div>
        </motion.div>
      </main>

      {/* Animated Scroll Progress Bar */}
      <TermsScrollBar activeSection={activeSection} setActiveSection={setActiveSection} />
    </>
  );
}
